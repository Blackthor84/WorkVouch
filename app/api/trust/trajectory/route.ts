/**
 * GET /api/trust/trajectory — Trust trajectory for current user (improving | stable | at_risk).
 * Backend calculation via getTrustTrajectory; no placeholder.
 */

import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getTrustTrajectory } from "@/lib/trust/trustTrajectory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await getTrustTrajectory(effective.id);
    return NextResponse.json({
      trajectory: payload.trajectory,
      label: payload.label,
      tooltipFactors: payload.tooltipFactors ?? [],
    });
  } catch (e) {
    console.error("[API ERROR] GET /api/trust/trajectory", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
