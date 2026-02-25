import type { TrustEngineSnapshot } from "./types";
import type { ExplainTrustResult } from "./types";
import { THRESHOLDS, INDUSTRY_PROFILES } from "./types";

/**
 * Explainability: why this trust score, top factors, risk factors, confidence.
 * Uses engine snapshot as single source of truth. For GET /api/trust/explain.
 */
export function explainTrustScore(snapshot: TrustEngineSnapshot): ExplainTrustResult {
  const threshold = THRESHOLDS[snapshot.employerMode];
  const profile = INDUSTRY_PROFILES[snapshot.industry];
  const topFactors: string[] = [];
  const riskFactors: string[] = [];

  if (snapshot.trustScore >= threshold) topFactors.push("meets_employer_threshold");
  if (snapshot.confidenceScore >= profile.minConfidence) topFactors.push("meets_industry_confidence");
  const verificationCount = snapshot.events.filter((e) => e.type === "verification").length;
  if (verificationCount > 0) topFactors.push("verified_signals");
  if (verificationCount >= 3) topFactors.push("strong_peer_network");
  if (snapshot.profileStrength >= 70) topFactors.push("profile_strength");

  const hasFraud = snapshot.events.some((e) => e.type === "conflict" || e.type === "resume");
  const hasConflict = snapshot.events.some((e) => e.type === "conflict");
  if (hasFraud) riskFactors.push("fraud_or_dispute");
  if (hasConflict) riskFactors.push("conflicting_claims");
  if (verificationCount === 0 && snapshot.events.length > 0) riskFactors.push("no_verification");

  const confidence =
    topFactors.length >= 2 && riskFactors.length === 0
      ? 0.9
      : topFactors.length >= 1
        ? 0.7
        : 0.5;

  return {
    trustScore: snapshot.trustScore,
    topFactors,
    riskFactors,
    confidence,
  };
}
