import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSuperAdminForApi } from "@/lib/admin/requireAdmin";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProfileRow = { id: string; user_id: string | null };

/**
 * POST /api/admin/impersonate — profile-based. Accepts profileId (profiles.id).
 */
export async function POST(req: Request) {
  try {
    const admin = await requireSuperAdminForApi();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: { profileId?: unknown };
    try {
      body = await req.json();
    } catch (e) {
      console.error("[impersonate] FAILED TO PARSE req.body:", e);
      return NextResponse.json(
        { error: "Invalid JSON body. Send { profileId: string }." },
        { status: 400 }
      );
    }

    const { profileId: rawProfileId } = body ?? {};

    if (!rawProfileId || typeof rawProfileId !== "string") {
      return NextResponse.json({ error: "profileId required" }, { status: 400 });
    }

    const profileId = rawProfileId;

    const supabase = getSupabaseServer();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("id", profileId)
      .single<ProfileRow>();

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const effectiveUserId = profile.user_id ?? profile.id;

    const cookieStore = await cookies();
    cookieStore.set("impersonatedUserId", effectiveUserId, { httpOnly: true, path: "/" });
    cookieStore.set("adminUserId", admin.authUserId, { httpOnly: true, path: "/" });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error("[impersonate] ERROR:", err);
    const message = err instanceof Error ? err.message : "Impersonation failed";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
