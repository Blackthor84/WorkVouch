/**
 * Deterministic, explainable trust score.
 * Weights: employment overlap +25, manager ref +20, peer refs +5 each (cap 20),
 * long tenure +15, date_conflict -20, duplicate_reviews -15, abuse_pattern -30,
 * single reference -10. Clamped 0–100.
 */

import type { TrustScoreInput } from "./types";

export function calculateTrustScore(data: TrustScoreInput): number {
  let score = 0;

  if (data.overlapVerified) score += 25;
  if (data.managerReference) score += 20;

  const peerCount = data.peerReferences?.length ?? 0;
  score += Math.min(peerCount * 5, 20);

  if ((data.tenureYears ?? 0) >= 3) score += 15;

  const flags = data.flags ?? [];
  if (flags.includes("date_conflict")) score -= 20;
  if (flags.includes("duplicate_reviews")) score -= 15;
  if (flags.includes("abuse_pattern")) score -= 30;
  if (peerCount === 1) score -= 10;

  return Math.max(0, Math.min(100, score));
}
