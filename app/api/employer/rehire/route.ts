import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getCurrentUser, hasRole } from "@/lib/auth";
import { checkFeatureAccess } from "@/lib/feature-flags";
import { calculateAndStoreRisk } from "@/lib/risk/calculateAndPersist";
import { calculateEmployerWorkforceRisk } from "@/lib/risk/workforce";

export const dynamic = "force-dynamic";

interface EmployerAccountRow {
  id: string;
}

async function getEmployerAccountId(userId: string): Promise<string | null> {
  const supabase = getSupabaseServer() as unknown as { from: (t: string) => { select: (c: string) => { eq: (col: string, val: string) => Promise<{ data: unknown; error: unknown }> } } };
  const { data } = await supabase.from("employer_accounts").select("id").eq("user_id", userId);
  const row = (Array.isArray(data) ? data[0] : data) as EmployerAccountRow | undefined;
  return row?.id ?? null;
}

/**
 * POST /api/employer/rehire
 * Body: { profileId: string, rehireEligible: boolean, internalNotes?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasEmployer = await hasRole("employer");
    const session = await getServerSession(authOptions);
    const roles = ((session?.user as { roles?: string[] })?.roles) ?? [];
    const isAdmin = roles.includes("admin") || roles.includes("superadmin");
    if (!hasEmployer && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const enabled = await checkFeatureAccess("rehire_system", { userId: user.id });
    if (!enabled) return NextResponse.json({ error: "Feature not enabled" }, { status: 403 });

    const employerAccountId = await getEmployerAccountId(user.id);
    if (!employerAccountId) return NextResponse.json({ error: "Employer account not found" }, { status: 404 });

    const body = await req.json();
    const profileId = body?.profileId ?? body?.profile_id;
    const rehireEligible = body?.rehireEligible ?? body?.rehire_eligible ?? true;
    const internalNotes = typeof body?.internalNotes === "string" ? body.internalNotes : (typeof body?.internal_notes === "string" ? body.internal_notes : null);

    if (!profileId || typeof profileId !== "string") {
      return NextResponse.json({ error: "profileId required" }, { status: 400 });
    }

    const supabase = getSupabaseServer() as unknown as {
      from: (table: string) => {
        upsert: (row: Record<string, unknown>, opts: { onConflict: string }) => Promise<{ error: unknown }>;
      };
    };

    const { error } = await supabase.from("rehire_registry").upsert(
      {
        employer_id: employerAccountId,
        profile_id: profileId,
        rehire_eligible: Boolean(rehireEligible),
        internal_notes: internalNotes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "employer_id,profile_id" }
    );

    if (error) {
      console.error("Rehire POST error:", error);
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }

    await calculateAndStoreRisk(profileId).catch(() => {});
    await calculateEmployerWorkforceRisk(employerAccountId).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Rehire API error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * GET /api/employer/rehire — all rehire entries for this employer
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasEmployer = await hasRole("employer");
    const session = await getServerSession(authOptions);
    const roles = ((session?.user as { roles?: string[] })?.roles) ?? [];
    const isAdmin = roles.includes("admin") || roles.includes("superadmin");
    if (!hasEmployer && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const enabled = await checkFeatureAccess("rehire_system", { userId: user.id });
    if (!enabled) return NextResponse.json({ error: "Feature not enabled" }, { status: 403 });

    const employerAccountId = await getEmployerAccountId(user.id);
    if (!employerAccountId) return NextResponse.json({ error: "Employer account not found" }, { status: 404 });

    const supabase = getSupabaseServer() as unknown as { from: (t: string) => { select: (c: string) => { eq: (col: string, val: string) => Promise<{ data: unknown; error: unknown }> } } };

    const { data: rows, error } = await supabase
      .from("rehire_registry")
      .select("id, profile_id, rehire_eligible, internal_notes, created_at, updated_at")
      .eq("employer_id", employerAccountId);

    if (error) {
      console.error("Rehire GET error:", error);
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }

    const list = (rows ?? []) as { id: string; profile_id: string; rehire_eligible: boolean; internal_notes: string | null; created_at: string; updated_at: string }[];
    const profileIds = list.map((r) => r.profile_id);
    const names: Record<string, string> = {};
    if (profileIds.length > 0) {
      const { data: profiles } = await (getSupabaseServer() as unknown as { from: (t: string) => { select: (c: string) => { in: (col: string, vals: string[]) => Promise<{ data: unknown }> } } })
        .from("profiles")
        .select("id, full_name")
        .in("id", profileIds);
      for (const p of (profiles ?? []) as { id: string; full_name: string | null }[]) {
        names[p.id] = p.full_name ?? "Unknown";
      }
    }
    const dataWithNames = list.map((r) => ({ ...r, full_name: names[r.profile_id] ?? "Unknown" }));

    return NextResponse.json({ data: dataWithNames });
  } catch (e) {
    console.error("Rehire GET error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * PATCH /api/employer/rehire — update rehireEligible or internalNotes for a profile
 * Body: { profileId: string, rehireEligible?: boolean, internalNotes?: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasEmployer = await hasRole("employer");
    const session = await getServerSession(authOptions);
    const roles = ((session?.user as { roles?: string[] })?.roles) ?? [];
    const isAdmin = roles.includes("admin") || roles.includes("superadmin");
    if (!hasEmployer && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const enabled = await checkFeatureAccess("rehire_system", { userId: user.id });
    if (!enabled) return NextResponse.json({ error: "Feature not enabled" }, { status: 403 });

    const employerAccountId = await getEmployerAccountId(user.id);
    if (!employerAccountId) return NextResponse.json({ error: "Employer account not found" }, { status: 404 });

    const body = await req.json();
    const profileId = body?.profileId ?? body?.profile_id;
    const rehireEligible = body?.rehireEligible ?? body?.rehire_eligible;
    const internalNotes = body?.internalNotes ?? body?.internal_notes;

    if (!profileId || typeof profileId !== "string") {
      return NextResponse.json({ error: "profileId required" }, { status: 400 });
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof rehireEligible === "boolean") update.rehire_eligible = rehireEligible;
    if (internalNotes !== undefined) update.internal_notes = typeof internalNotes === "string" ? internalNotes : null;

    const supabase = getSupabaseServer() as unknown as {
      from: (t: string) => {
        update: (row: Record<string, unknown>) => { eq: (col: string, val: string) => { eq: (col2: string, val2: string) => Promise<{ error: unknown }> } };
      };
    };

    const { error } = await supabase
      .from("rehire_registry")
      .update(update)
      .eq("employer_id", employerAccountId)
      .eq("profile_id", profileId);

    if (error) {
      console.error("Rehire PATCH error:", error);
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }

    await calculateAndStoreRisk(profileId).catch(() => {});
    await calculateEmployerWorkforceRisk(employerAccountId).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Rehire PATCH error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
