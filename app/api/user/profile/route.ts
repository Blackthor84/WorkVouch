import { NextResponse } from "next/server";
import { getEffectiveUser, getProfile } from "@/lib/auth";
import { getAdminSandboxModeFromCookies } from "@/lib/sandbox/sandboxContext";
import { getSupabaseSession } from "@/lib/supabase/server";
import { applyScenario } from "@/lib/impersonation/scenarioResolver";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/user/profile — returns role, onboarding_completed, sandbox_mode for effective user (impersonation-aware).
 */
export async function GET() {
  try {
    const effective = await getEffectiveUser();
    if (!effective || effective.deleted_at) {
      return NextResponse.json({
        profile: null,
        role: null,
        onboarding_completed: false,
        sandbox_mode: false,
      });
    }
    const profile = await getProfile(effective.id);
    const role = (profile.role ?? "").toLowerCase();
    const isAdmin = role === "admin" || role === "superadmin";
    const sandbox_mode = isAdmin ? await getAdminSandboxModeFromCookies() : false;

    const payload = {
      profile: {
        role: profile.role,
        onboarding_completed: profile.onboarding_completed,
        sandbox_mode,
      },
      role: profile.role,
      onboarding_completed: profile.onboarding_completed,
      sandbox_mode,
    };
    const { session } = await getSupabaseSession();
    return NextResponse.json(applyScenario(payload, session?.impersonation));
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
