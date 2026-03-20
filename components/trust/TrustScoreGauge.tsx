"use client";

import { TrustRankInlineBadge } from "@/components/trust/TrustRankInlineBadge";

export default function TrustScoreGauge({
  score,
  referenceCount = 0,
  className,
}: {
  score: number;
  /** Total reviews counted in rank (reference_feedback + employment + coworker references). */
  referenceCount?: number;
  className?: string;
}) {
  const display = Math.round(Math.min(100, Math.max(0, score)));
  const percentage = display;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span aria-hidden className="text-amber-500">
            ⭐
          </span>
          <span>{display} Trust Score</span>
        </p>
        <TrustRankInlineBadge score={display} reviewCount={referenceCount} />
      </div>

      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-500 min-w-0"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={display}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>0</span>
        <span>100</span>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
        Blended from review quality, review volume, match strength, and verified jobs (rank formula v1).
      </p>
    </div>
  );
}
