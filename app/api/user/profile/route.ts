import { NextResponse } from "next/server";
import { getCurrentUser, getProfile } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/user/profile — returns role and onboarding_completed for the current user.
 * Used by the client auth listener to decide redirect after sign-in.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const profile = await getProfile(user.id);
    return NextResponse.json({
      role: profile.role,
      onboarding_completed: profile.onboarding_completed,
    });
  } catch (e) {
    console.error("[api/user/profile]", e);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
