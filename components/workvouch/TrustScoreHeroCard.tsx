"use client";

import type { TrustOverview } from "@/lib/actions/trustOverview";
import { WvCard, WvTrustScore, WvBadge, WvButton } from "@/components/wv";

function getScoreLabel(score: number): string {
  if (score >= 86) return "Highly Verified";
  if (score >= 61) return "Strong Reputation";
  if (score >= 31) return "Building Trust";
  return "Getting Started";
}

function getBadgeVariant(score: number): "success" | "brand" | "warning" | "default" {
  if (score >= 86) return "success";
  if (score >= 61) return "brand";
  if (score >= 31) return "warning";
  return "default";
}

export function TrustScoreHeroCard({ data }: { data: TrustOverview }) {
  const score = Math.min(100, Math.max(0, data.trustScore));
  const label = getScoreLabel(score);

  return (
    <WvCard glow padding="lg">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-6">
          <WvTrustScore score={score} size="md" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-wv-subtle">Trust Score</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold tabular-nums text-wv-foreground">{score}</span>
              <span className="text-wv-muted font-medium">/ 100</span>
            </div>
            <WvBadge variant={getBadgeVariant(score)} className="mt-2">
              {label}
            </WvBadge>
          </div>
        </div>
        <WvButton href="/jobs/new" variant="secondary" size="sm">
          Improve score
        </WvButton>
      </div>
      <p className="mt-4 text-xs text-wv-subtle">Based on verified coworker references</p>
      <div className="mt-4 h-2 w-full rounded-full bg-wv-bg overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-600 transition-all duration-700 ease-out"
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="mt-6 pt-6 border-t border-wv-border grid grid-cols-3 gap-4 text-center sm:text-left">
        <div>
          <p className="text-2xl font-semibold text-wv-foreground tabular-nums">{data.verifiedReferences}</p>
          <p className="text-xs font-medium text-wv-subtle uppercase tracking-wider">Verified references</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-wv-foreground tabular-nums">{data.coworkerMatches}</p>
          <p className="text-xs font-medium text-wv-subtle uppercase tracking-wider">Coworker matches</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-wv-foreground tabular-nums">{data.completedJobs}</p>
          <p className="text-xs font-medium text-wv-subtle uppercase tracking-wider">Completed jobs</p>
        </div>
      </div>
    </WvCard>
  );
}
