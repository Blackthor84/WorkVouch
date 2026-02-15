/**
 * Culture-aware matching. Uses signals probabilistically; adjusts ranking only.
 * Never hard-blocks, never outputs a final "fit score". Gated by USE_CULTURE_IN_MATCHING.
 */

import { FEATURE_FLAGS } from "./flags";
import { getPeerWorkstyleSignals } from "./peerWorkstyle";

/**
 * Returns a soft weight in [0, 1] for ranking only. Not a fit score; never used to block.
 * When USE_CULTURE_IN_MATCHING is false, returns 1 (neutral). When true, uses workstyle
 * signals probabilistically to nudge ranking (e.g. higher alignment => slightly higher weight).
 */
export async function getCultureRankingWeight(userId: string): Promise<number> {
  if (!FEATURE_FLAGS.USE_CULTURE_IN_MATCHING) return 1;
  const signals = await getPeerWorkstyleSignals(userId);
  const positive = ["LOW_FRICTION", "TEAM_POSITIVE", "HIGH_PEER_ALIGNMENT", "GOES_ABOVE_EXPECTATIONS", "CONSISTENT_ATTENDANCE"];
  const negative = ["REPEATED_CONFLICT", "DISPUTED_VOUCHES", "OUTLIER_REPORTS"];
  let w = 0.5;
  for (const s of signals) {
    if (s.confidence_score <= 0) continue;
    if (positive.includes(s.signal_key)) w += s.confidence_score * 0.08;
    if (negative.includes(s.signal_key)) w -= s.confidence_score * 0.05;
  }
  return Math.max(0.2, Math.min(1, w));
}
