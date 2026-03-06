/**
 * GET /api/trust/benchmark/[profileId]
 * Industry trust benchmark: user score vs industry average and top 10%. Reads from stored trust_scores.
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getTrustBenchmark } from "@/lib/trust/benchmark";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type TrustBenchmarkResponse = {
  industry: string;
  userScore: number;
  industryAverage: number;
  top10Percent: number;
  percentile: number;
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
    const result = await getTrustBenchmark(profileId);
    return NextResponse.json({
      industry: result.industry,
      userScore: result.userScore,
      industryAverage: result.industryAverage,
      top10Percent: result.top10Percent,
      percentile: result.percentile,
    } satisfies TrustBenchmarkResponse);
  } catch (e) {
    console.error("[trust/benchmark]", e);
    return NextResponse.json(
      { error: "Failed to compute benchmark" },
      { status: 500 }
    );
  }
}
