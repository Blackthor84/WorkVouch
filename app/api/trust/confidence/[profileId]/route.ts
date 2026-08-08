import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { canViewCandidateProfile } from "@/lib/actions/employer/employerDashboardStats";
import { hiringConfidenceEngine } from "@/lib/trust/confidence";

type RouteParams = { params: Promise<{ profileId: string }> };

/** GET /api/trust/confidence/[profileId] — Hiring Confidence Engine (presentation layer). */
export async function GET(_request: Request, { params }: RouteParams) {
  const { profileId } = await params;
  if (!profileId) {
    return NextResponse.json({ error: "Missing profile id" }, { status: 400 });
  }

  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (effective.id !== profileId) {
    const access = await canViewCandidateProfile(profileId);
    if (!access.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const result = await hiringConfidenceEngine.computeForProfile(profileId);
    return NextResponse.json({
      confidenceScore: result.confidenceScore,
      confidenceLevel: result.confidenceLevel,
      confidenceLevelLabel: result.confidenceLevelLabel,
      starRating: result.starRating,
      confidenceFactors: result.confidenceFactors,
      confidenceTimeline: result.confidenceTimeline,
      confidenceBadges: result.confidenceBadges.filter((b) => b.earned),
      confidenceExplanation: result.confidenceExplanation,
      recommendation: result.recommendation,
      recommendationLabel: result.recommendationLabel,
      trustScore: result.trustScore,
      calculatedAt: result.calculatedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to compute hiring confidence";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
