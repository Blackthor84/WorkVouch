"use client";

import { cn } from "@/lib/utils";
import { getTrustRankBadge } from "@/lib/trust/trustRanking";

export function TrustRankInlineBadge({
  score,
  reviewCount,
  className,
}: {
  score: number;
  reviewCount: number;
  className?: string;
}) {
  const b = getTrustRankBadge(score, reviewCount);
  if (b.level === "none") return null;

  const tone =
    b.level === "elite"
      ? "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100"
      : b.level === "trusted"
        ? "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100"
        : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums",
        tone,
        className
      )}
      title={`Trust rank: ${b.label}`}
    >
      <span aria-hidden>{b.emoji}</span>
      {b.label}
    </span>
  );
}
