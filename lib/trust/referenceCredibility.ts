/**
 * Reference credibility: references earn trust over time.
 * Fake references become expensive to maintain. Use in trust score: weightedPeerScore += credibilityScore / 10.
 * Deterministic, in-memory; no DB writes for demo.
 */

export type ReferenceCredibilityInput = {
  confirmedByOthers?: boolean;
  historyAccuracy?: boolean;
  flagged?: boolean;
  role?: "manager" | "peer" | string;
};

export function calculateReferenceCredibility(
  reference: ReferenceCredibilityInput
): number {
  let score = 50;

  if (reference.confirmedByOthers) score += 20;
  if (reference.historyAccuracy) score += 15;
  if (reference.flagged) score -= 30;
  if (reference.role === "manager") score += 10;

  return Math.max(0, Math.min(100, score));
}
