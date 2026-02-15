import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { getGodModeState, buildGodModeToken, getGodModeCookieName, GODMODE_MAX_AGE_SECONDS } from "@/lib/auth/godModeCookie";
import { writeGodModeAudit } from "@/lib/godModeAudit";
import { isAdmin } from "@/lib/auth/isAdmin";
import { isSandboxEnv } from "@/lib/sandbox/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = getGodModeCookieName();

/**
 * GET /api/admin/godmode — return current God Mode status (for banner).
 * Only Superadmin gets enabled: true when cookie is valid.
 */
export async function GET() {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ enabled: false }, { status: 401 });

    const { data: profile } = await (supabase as any).from("profiles").select("role").eq("id", user.id).single();
    const role = (profile as { role?: string })?.role ?? (user as { app_metadata?: { role?: string } }).app_metadata?.role ?? "";
    const isSuperAdmin = isAdmin({ role }) && String(role).toUpperCase() === "SUPERADMIN";

    if (!isSuperAdmin) return NextResponse.json({ enabled: false });

    const state = await getGodModeState(user.id, true);
    return NextResponse.json({ enabled: state.enabled, enabledAt: state.enabledAt });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}

/**
 * POST /api/admin/godmode — toggle God Mode. Body: { enabled: boolean }.
 * Only SUPERADMIN may set. Clears on logout (cookie not sent after logout).
 */
export async function POST(request: Request) {
  try {
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await (supabase as any).from("profiles").select("role").eq("id", user.id).single();
    const role = (profile as { role?: string })?.role ?? (user as { app_metadata?: { role?: string } }).app_metadata?.role ?? "";
    const isSuperAdmin = isAdmin({ role }) && String(role).toUpperCase() === "SUPERADMIN";

    if (!isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const enabled = Boolean(body?.enabled);

    const environment = isSandboxEnv() ? "sandbox" : "production";
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
    const userAgent = request.headers.get("user-agent") || null;

    await writeGodModeAudit({
      superadmin_id: user.id,
      superadmin_email: user.email ?? null,
      action: enabled ? "godmode_enable" : "godmode_disable",
      environment,
      ip_address: ip,
      user_agent: userAgent,
    });

    const cookieStore = await cookies();
    const res = NextResponse.json({ enabled });

    if (enabled) {
      const { token } = await buildGodModeToken(user.id);
      cookieStore.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: GODMODE_MAX_AGE_SECONDS,
        path: "/",
      });
    } else {
      cookieStore.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    }

    return res;
  } catch (e) {
    console.error("[admin/godmode]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
