import { NextResponse } from "next/server";
import { getCurrentUser, getProfile } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/user/profile — returns role and onboarding_completed for the current user.
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
      });
    }
    const profile = await getProfile(user.id);
    return NextResponse.json({
      profile: { role: profile.role, onboarding_completed: profile.onboarding_completed },
      role: profile.role,
      onboarding_completed: profile.onboarding_completed,
    });
  } catch (e) {
    console.error("[api/user/profile]", e);
    return NextResponse.json({
      profile: null,
      role: null,
      onboarding_completed: false,
    });
  }
}
