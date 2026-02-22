import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSuperAdminForApi } from "@/lib/admin/requireAdmin";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const IMPERSONATION_COOKIE = "impersonation_session";

type ProfileRow = { id: string; user_id: string | null };

/**
 * POST /api/admin/impersonate — Accepts profileId or userId. Sets impersonation_session cookie.
 */
export async function POST(req: Request) {
  try {
    const admin = await requireSuperAdminForApi();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: { profileId?: unknown; userId?: unknown };
    try {
      body = await req.json();
    } catch (e) {
      console.error("[impersonate] FAILED TO PARSE req.body:", e);
      return NextResponse.json(
        { error: "Invalid JSON body. Send { profileId: string } or { userId: string }." },
        { status: 400 }
      );
    }

    const rawProfileId = body?.profileId;
    const rawUserId = body?.userId;

    let impersonatedUserId: string;

    if (rawUserId != null && typeof rawUserId === "string" && rawUserId.trim()) {
      impersonatedUserId = rawUserId.trim();
    } else if (rawProfileId != null && typeof rawProfileId === "string" && rawProfileId.trim()) {
      const profileId = (rawProfileId as string).trim();
      const supabase = getSupabaseServer();
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, user_id")
        .eq("id", profileId)
        .single<ProfileRow>();

      if (error || !profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
      }
      impersonatedUserId = profile.user_id ?? profile.id;
    } else {
      return NextResponse.json({ error: "profileId or userId required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set(
      IMPERSONATION_COOKIE,
      JSON.stringify({
        adminId: admin.authUserId,
        impersonatedUserId,
        startedAt: Date.now(),
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      }
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("[impersonate] ERROR:", err);
    const message = err instanceof Error ? err.message : "Impersonation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
