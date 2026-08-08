/**
 * GET /api/trust/score/[profileId]
 * Legacy wrapper — delegates to canonical trust engine.
 * Prefer GET /api/trust/[userId] for full bundle.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { calculateTrust } from "@/lib/trust/trustEngine";

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
  { params }: { params: Promise<{ profileId: string }> },
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
  const isEmployer = effective.role === "employer";
  if (!isOwner && !isAdmin && !isEmployer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await calculateTrust(profileId);
    return NextResponse.json({
      score: result.score,
      band: result.band,
      trajectory: result.trajectory,
      trajectoryLabel: result.trajectoryLabel,
    } satisfies TrustScoreProfileResponse);
  } catch (e) {
    console.error("[trust/score/[profileId]]", e);
    return NextResponse.json({ error: "Failed to compute trust score" }, { status: 500 });
  }
}
