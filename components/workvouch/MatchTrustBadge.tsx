"use client";

import { getTrustRankBadge } from "@/lib/trust/trustRanking";

/**
 * Trust badge for match cards. Uses rank tiers when reviewCount is known; else score-only bands.
 */
export function MatchTrustBadge({
  score = 0,
  reviewCount,
}: {
  score?: number;
  reviewCount?: number;
}) {
  const s = Math.round(Math.min(100, Math.max(0, score)));

  if (reviewCount != null) {
    const b = getTrustRankBadge(s, reviewCount);
    if (b.level !== "none") {
      return (
        <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100">
          <span aria-hidden>{b.emoji}</span>
          {b.label}
        </span>
      );
    }
  }

  let label = "Bronze";
  if (s >= 75) label = "Gold";
  else if (s >= 50) label = "Silver";
  else if (s >= 25) label = "Silver";

  return (
    <span className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800">
      {label}
    </span>
  );
}
