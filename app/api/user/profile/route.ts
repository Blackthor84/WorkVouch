import { NextResponse } from "next/server";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { getAdminSandboxModeFromCookies } from "@/lib/sandbox/sandboxContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/user/profile — returns role, onboarding_completed, and sandbox_mode for the current user.
 * sandbox_mode is true only when user is admin/superadmin and sandbox_mode cookie is set.
 * Never returns 401/500: no user or failure → 200 with profile: null so app boot never crashes.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({
        profile: null,
        role: null,
        onboarding_completed: false,
        sandbox_mode: false,
      });
    }
    const profile = await getProfile(user.id);
    const role = (profile.role ?? "").toLowerCase();
    const isAdmin = role === "admin" || role === "superadmin";
    const sandbox_mode = isAdmin ? await getAdminSandboxModeFromCookies() : false;

    return NextResponse.json({
      profile: {
        role: profile.role,
        onboarding_completed: profile.onboarding_completed,
        sandbox_mode,
      },
      role: profile.role,
      onboarding_completed: profile.onboarding_completed,
      sandbox_mode,
    });
  } catch (e) {
    console.error("[api/user/profile]", e);
    return NextResponse.json({
      profile: null,
      role: null,
      onboarding_completed: false,
      sandbox_mode: false,
    });
  }
}
