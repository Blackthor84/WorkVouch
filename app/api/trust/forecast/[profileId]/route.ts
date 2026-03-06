/**
 * GET /api/trust/forecast/[profileId]
 * Trust forecast from trust_events only. Returns trajectory, confidence, recentImpact, previousImpact.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getTrustForecast } from "@/lib/trust/forecast";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type TrustForecastResponse = {
  trajectory: "improving" | "stable" | "at_risk";
  confidence: number;
  recentImpact: number;
  previousImpact: number;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin =
    effective.role === "admin" ||
    effective.role === "superadmin" ||
    effective.role === "super_admin";
  const isEmployer = effective.role === "employer";
  const isOwner = effective.id === profileId;
  if (!isOwner && !isAdmin && !isEmployer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await getTrustForecast(profileId);
    return NextResponse.json({
      trajectory: result.trajectory,
      confidence: result.confidence,
      recentImpact: result.recentImpact,
      previousImpact: result.previousImpact,
    } satisfies TrustForecastResponse);
  } catch (e) {
    console.error("[trust/forecast]", e);
    return NextResponse.json(
      { error: "Failed to compute forecast" },
      { status: 500 }
    );
  }
}
