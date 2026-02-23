import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { getOrCreateSnapshot } from "@/lib/intelligence/getOrCreateSnapshot";
import { explainTrustScore } from "@/lib/trust/explainTrustScore";
import type { TrustScoreInput } from "@/lib/trust/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/trust/explain — explainability: trust score, top factors, risk factors, confidence.
 * Uses effective user (impersonation-aware). Optional query: profileId (admin viewing a user).
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
    peerReferences: Array.from({ length: Math.min(Math.floor(referenceScore / 25), 4) }, (_, i) => ({ id: `ref-${i}` })),
    tenureYears: tenureScore >= 60 ? 3 : tenureScore >= 30 ? 2 : 1,
    flags: [],
  };

  const result = explainTrustScore(data);
  return NextResponse.json({
    ...result,
    confidenceLevel: result.confidence,
  });
}
