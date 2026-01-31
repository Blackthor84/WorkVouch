import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { checkFeatureAccess } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

/**
 * POST /api/employer/rehire
 * Set rehire status for a candidate. Employer or admin only. Behind rehire_internal feature flag.
 * Body: { candidate_id: string, rehire_flag: boolean, notes?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isEmployer = await hasRole("employer");
    const session = await getServerSession(authOptions);
    const roles = ((session?.user as { roles?: string[] })?.roles) ?? [];
    const isAdmin = roles.includes("admin") || roles.includes("superadmin");
    if (!isEmployer && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const enabled = await checkFeatureAccess("rehire_internal", { userId: user.id });
    if (!enabled) {
      return NextResponse.json({ error: "Feature not enabled" }, { status: 403 });
    }

    const body = await req.json();
    const candidateId = body?.candidate_id;
    const rehireFlag = Boolean(body?.rehire_flag);
    const notes = typeof body?.notes === "string" ? body.notes : null;

    if (!candidateId || typeof candidateId !== "string") {
      return NextResponse.json({ error: "candidate_id required" }, { status: 400 });
    }

    const supabase = getSupabaseServer() as any;
    const employerId = user.id;

    const { error } = await supabase.from("employer_candidate_rehire").upsert(
      {
        employer_id: employerId,
        candidate_id: candidateId,
        rehire_status: rehireFlag ? "would_rehire" : "none",
        rehire_notes: notes ?? null,
        rehire_flag: rehireFlag,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "employer_id,candidate_id" }
    );

    if (error) {
      console.error("Rehire upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Rehire API error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
