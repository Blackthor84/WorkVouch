import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getOrCreateSnapshot } from "@/lib/intelligence/getOrCreateSnapshot";
import { generateTrustReport } from "@/lib/trust/generateTrustReport";
import { explainTrustScore } from "@/lib/trust/explainTrustScore";
import { buildTrustTimeline } from "@/lib/trust/buildTrustTimeline";
import type { TrustScoreInput, TrustTimelineEvent } from "@/lib/trust/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/trust/report — exportable trust report (JSON). Enterprise.
 * Returns trustScore, strengths, risks, timeline, disclaimer.
 */
export async function GET(req: NextRequest) {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const profileId = searchParams.get("profileId")?.trim() || effective.id;

  const snapshot = await getOrCreateSnapshot(profileId);
  const careerHealth = Math.max(0, Math.min(100, Number(snapshot.career_health_score) ?? 0));
  const tenureScore = Math.max(0, Math.min(100, Number(snapshot.tenure_score) ?? 0));
  const referenceScore = Math.max(0, Math.min(100, Number(snapshot.reference_score) ?? 0));

  const data: TrustScoreInput = {
    overlapVerified: referenceScore > 50,
    managerReference: referenceScore > 70,
    peerReferences: Array.from(
      { length: Math.min(Math.floor(referenceScore / 25), 4) },
      (_, i) => ({ id: `ref-${i}` })
    ),
    tenureYears: tenureScore >= 60 ? 3 : tenureScore >= 30 ? 2 : 1,
    flags: [],
  };

  const explained = explainTrustScore(data);
  const baseScore = 50;
  const events: TrustTimelineEvent[] = [
    { time: Date.now() - 86400000 * 30, delta: 10, reason: "Employment verified" },
    { time: Date.now() - 86400000 * 14, delta: 5, reason: "Peer reference added" },
    { time: Date.now(), delta: 0, reason: "Current" },
  ];
  const timeline = buildTrustTimeline(baseScore, events);

  const report = generateTrustReport({
    score: explained.trustScore,
    positives: explained.topFactors,
    flags: explained.riskFactors,
    timeline,
  });

  return NextResponse.json(report);
}
