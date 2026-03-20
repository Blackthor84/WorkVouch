/**
 * Trust ranking (rank-v1) — mirrors DB formula weights for UI badges and copy.
 * Server trust_scores.score is the source of truth; badges use score + reference_count.
 */

export const TRUST_RANK_WEIGHTS = {
  reviewQuality: 0.4,
  reviewVolume: 0.2,
  matchStrength: 0.2,
  verifiedJobs: 0.2,
} as const;

export type TrustRankBadgeLevel = "none" | "verified" | "trusted" | "elite";

export type TrustRankBadge = {
  level: TrustRankBadgeLevel;
  label: string;
  emoji: string;
};

/**
 * Badges (product rules):
 * - Verified: 1+ reviews
 * - Trusted: 5+ reviews and score > 75
 * - Elite: 10+ reviews and score > 90
 */
export function getTrustRankBadge(score: number, reviewCount: number): TrustRankBadge {
  const s = Math.round(Math.min(100, Math.max(0, score)));
  const n = Math.max(0, Math.floor(reviewCount));

  if (n >= 10 && s > 90) {
    return { level: "elite", label: "Elite", emoji: "🟣" };
  }
  if (n >= 5 && s > 75) {
    return { level: "trusted", label: "Trusted", emoji: "🔵" };
  }
  if (n >= 1) {
    return { level: "verified", label: "Verified", emoji: "🟢" };
  }
  return { level: "none", label: "", emoji: "" };
}

/** Future: spam / coordination detection (velocity caps, graph anomalies) — server-side only. */
