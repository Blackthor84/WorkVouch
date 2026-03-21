import { NextResponse } from "next/server";
import { resolveEmployerDataAccess } from "@/lib/employer/employerPlanServer";

const UPGRADE = {
  code: "UPGRADE_REQUIRED" as const,
  upgradeUrl: "/enterprise/upgrade",
};

/**
 * Team risk / workforce APIs: paid profiles.plan only (pro/enterprise + subscription rules).
 */
export async function rejectFreeEmployerPlan(userId: string): Promise<NextResponse | null> {
  const access = await resolveEmployerDataAccess(userId);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  if (access.mode === "free_preview") {
    return NextResponse.json(
      {
        error: "Team risk view requires a paid plan. Upgrade to unlock full workforce insights.",
        ...UPGRADE,
      },
      { status: 403 }
    );
  }
  return null;
}
