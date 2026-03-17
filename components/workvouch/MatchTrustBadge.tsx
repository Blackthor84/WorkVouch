"use client";

/**
 * Trust tier badge for match cards. Score is 0–100 (from trust_scores).
 * Bronze < 25, Silver 25–49, Gold 50–74, Elite 75+.
 */
export function MatchTrustBadge({ score = 0 }: { score?: number }) {
  let label = "Bronze";
  if (score >= 75) label = "Elite";
  else if (score >= 50) label = "Gold";
  else if (score >= 25) label = "Silver";

  return (
    <span className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800">
      {label}
    </span>
  );
}
