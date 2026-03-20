"use client";

import { cn } from "@/lib/utils";
import { getTrustRankBadge } from "@/lib/trust/trustRanking";
import { StarIcon } from "@heroicons/react/24/solid";

export function trustScoreColor(score: number): string {
  if (score > 70) return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800";
  if (score >= 40) return "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-800";
  return "text-red-600 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-800";
}

export function TrustScoreBadge({
  score,
  referenceCount,
  size = "md",
  blur,
  className,
}: {
  score: number;
  /** When set, shows rank badge (Verified / Trusted / Elite) next to the score. */
  referenceCount?: number;
  size?: "sm" | "md" | "lg";
  blur?: boolean;
  className?: string;
}) {
  const displayScore = Math.min(100, Math.max(0, Math.round(score)));
  const sizeClass =
    size === "lg" ? "text-3xl font-bold" : size === "md" ? "text-xl font-semibold" : "text-sm font-medium";
  const rank =
    referenceCount != null
      ? getTrustRankBadge(displayScore, referenceCount)
      : { level: "none" as const, label: "", emoji: "" };

  return (
    <span
      className={cn(
        "inline-flex flex-col items-stretch gap-1 rounded-xl border px-3 py-1.5 tabular-nums",
        trustScoreColor(displayScore),
        blur && "blur-sm select-none",
        className
      )}
    >
      <span className={cn("inline-flex items-center justify-center gap-1.5", sizeClass)}>
        <StarIcon className={cn("text-amber-500 shrink-0", size === "lg" ? "h-7 w-7" : size === "md" ? "h-5 w-5" : "h-4 w-4")} aria-hidden />
        {displayScore}
      </span>
      {rank.level !== "none" && (
        <span className="text-[10px] font-semibold leading-tight text-center opacity-90">
          {rank.emoji} {rank.label}
        </span>
      )}
    </span>
  );
}
