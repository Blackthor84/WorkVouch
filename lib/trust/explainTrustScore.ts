import { calculateTrustScore } from "./calculateTrustScore";
import type { TrustScoreInput } from "./types";
import type { ExplainTrustResult } from "./types";

/**
 * Explainability: why this trust score, top factors, risk factors, confidence.
 * For GET /api/trust/explain and investor-facing "why should I trust this?"
 */
export function explainTrustScore(data: TrustScoreInput): ExplainTrustResult {
  const score = calculateTrustScore(data);
  const topFactors: string[] = [];
  const riskFactors: string[] = [...(data.flags ?? [])];

  if (data.overlapVerified) topFactors.push("employment_overlap");
  if (data.managerReference) topFactors.push("manager_reference");
  const peerCount = data.peerReferences?.length ?? 0;
  if (peerCount > 0) topFactors.push("peer_references");
  if ((data.tenureYears ?? 0) >= 3) topFactors.push("long_tenure");

  const confidence =
    topFactors.length >= 2 && riskFactors.length === 0 ? 0.9 : topFactors.length >= 1 ? 0.7 : 0.5;

  return {
    trustScore: score,
    topFactors,
    riskFactors,
    confidence,
  };
}
