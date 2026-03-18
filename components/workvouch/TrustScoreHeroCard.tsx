"use client";

import type { TrustOverview } from "@/lib/actions/trustOverview";
import { cn } from "@/lib/utils";

function getScoreLabel(score: number): string {
  if (score >= 86) return "Highly Verified 🔥";
  if (score >= 61) return "Strong Reputation";
  if (score >= 31) return "Building Trust";
  return "Getting Started";
}

export function TrustScoreHeroCard({ data }: { data: TrustOverview }) {
  const score = Math.min(100, Math.max(0, data.trustScore));
  const label = getScoreLabel(score);

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm",
        "bg-gradient-to-br from-white to-slate-50/50",
        "transition-shadow hover:shadow-md"
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl sm:text-5xl font-bold tabular-nums text-slate-900">
            {score}
          </span>
          <span className="text-slate-500 font-medium">/ 100</span>
        </div>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
      <div className="mt-4 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 ease-out"
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 text-center sm:text-left">
        <div>
          <p className="text-2xl font-semibold text-slate-900">{data.verifiedReferences}</p>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Verified references</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900">{data.coworkerMatches}</p>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Coworker matches</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900">{data.completedJobs}</p>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Completed jobs</p>
        </div>
      </div>
    </div>
  );
}
