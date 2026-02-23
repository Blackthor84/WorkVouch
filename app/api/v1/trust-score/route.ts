import { NextRequest, NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { getOrCreateSnapshot } from "@/lib/intelligence/getOrCreateSnapshot";
import { explainTrustScore } from "@/lib/trust/explainTrustScore";
import type { TrustScoreInput } from "@/lib/trust/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/trust-score — API-only trust score for candidate.
 * Query: candidateId (required).
 * Admin or paid access only; rate-limit + paid access in production.
 * Response: trustScore, confidence, riskFlags, explainabilityUrl.
 */
export async function GET(req: NextRequest) {
  const authed = await getAuthedUser();
  const isAdmin = authed?.role === "admin" || authed?.role === "superadmin";
  const apiKey = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!isAdmin && !apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const candidateId = searchParams.get("candidateId")?.trim();
  if (!candidateId) {
    return NextResponse.json({ error: "candidateId required" }, { status: 400 });
  }

  const snapshot = await getOrCreateSnapshot(candidateId);
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
  const trustScore = Math.round(result.trustScore);
  const confidence =
    result.confidence >= 0.8 ? "high" : result.confidence >= 0.5 ? "medium" : "low";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const explainabilityUrl = baseUrl
    ? `${baseUrl}/trust/explain/${candidateId}`
    : `/trust/explain/${candidateId}`;

  return NextResponse.json({
    trustScore,
    confidence,
    riskFlags: result.riskFactors,
    explainabilityUrl,
  });
}
