"use client";

import { WvCard } from "@/components/wv";
import { WvTrustScore } from "@/components/wv/WvTrustScore";
import { WvBadge } from "@/components/wv/WvBadge";
import { WvLoadingState } from "@/components/wv/WvLoadingState";
import type { TrustExplanationLine, TrustBadge } from "@/lib/trust/trustExplanation";
import { getTrustBandLabel } from "@/lib/trust/trustBandLabels";

type Props = {
  score: number;
  bandLabel?: string;
  trajectoryLabel?: string;
  explanation?: TrustExplanationLine[];
  badges?: TrustBadge[];
  loading?: boolean;
  compact?: boolean;
};

/** Canonical trust visualization — one card for all surfaces. */
export function TrustCard({
  score,
  bandLabel,
  trajectoryLabel,
  explanation = [],
  badges = [],
  loading = false,
  compact = false,
}: Props) {
  if (loading) {
    return (
      <WvCard padding="lg">
        <WvLoadingState label="Loading trust score…" />
      </WvCard>
    );
  }

  const label = bandLabel ?? getTrustBandLabel(score);

  return (
    <WvCard glow={!compact} padding={compact ? "md" : "lg"}>
      <div className={`flex gap-6 ${compact ? "flex-row items-center" : "flex-col sm:flex-row sm:items-start"}`}>
        <WvTrustScore score={score} size={compact ? "sm" : "md"} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-wv-muted">Trust score</p>
          <p className="text-lg font-semibold text-wv-foreground">{label}</p>
          {trajectoryLabel && (
            <p className="mt-1 text-xs text-wv-subtle">Trend · {trajectoryLabel}</p>
          )}

          {badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.map((b) => (
                <WvBadge key={b.id} variant="default">
                  {b.label}
                </WvBadge>
              ))}
            </div>
          )}

          {!compact && explanation.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-wv-subtle">
                Score factors
              </p>
              <ul className="space-y-1.5 text-sm">
                {explanation.map((line, i) => (
                  <li
                    key={i}
                    className={
                      line.kind === "positive"
                        ? "text-emerald-400"
                        : line.kind === "negative"
                          ? "text-red-400"
                          : "text-wv-muted"
                    }
                  >
                    {line.kind === "positive" ? "+ " : line.kind === "negative" ? "− " : "• "}
                    {line.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </WvCard>
  );
}
