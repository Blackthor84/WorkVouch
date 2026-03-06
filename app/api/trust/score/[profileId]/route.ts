/**
 * GET /api/trust/score/[profileId]
 * Returns trust score (sum of impact_score from trust_events), band, and trajectory.
 * Auth: owner or admin.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { calculateTrustScore } from "@/lib/trust/eventEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type TrustScoreProfileResponse = {
  score: number;
  band: "low" | "medium" | "high";
  trajectory: "improving" | "stable" | "at_risk";
  trajectoryLabel?: string;
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
  const isOwner = effective.id === profileId;
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await calculateTrustScore(profileId);
    return NextResponse.json({
      score: result.score,
      band: result.band,
      trajectory: result.trajectory,
      trajectoryLabel: result.trajectoryLabel,
    } satisfies TrustScoreProfileResponse);
  } catch (e) {
    console.error("[trust/score/[profileId]]", e);
    return NextResponse.json(
      { error: "Failed to compute trust score" },
      { status: 500 }
    );
  }
}
