"use client";

import { WvCard } from "@/components/wv";
import { WvTrustScore } from "@/components/wv/WvTrustScore";
import type { TrustExplanationLine, TrustBadge } from "@/lib/trust/trustExplanation";

type Props = {
  score: number;
  bandLabel?: string;
  trajectoryLabel?: string;
  explanation?: TrustExplanationLine[];
  badges?: TrustBadge[];
  loading?: boolean;
  compact?: boolean;
};

function bandLabelFromScore(score: number): string {
  if (score < 40) return "Needs improvement";
  if (score < 60) return "Fair";
  if (score < 80) return "Good";
  return "Excellent";
}

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
      <WvCard className="py-10 text-center text-sm text-wv-muted">Loading trust score…</WvCard>
    );
  }

  const label = bandLabel ?? bandLabelFromScore(score);

  return (
    <WvCard glow={!compact} padding={compact ? "md" : "lg"}>
      <div className={`flex gap-6 ${compact ? "flex-row items-center" : "flex-col sm:flex-row sm:items-start"}`}>
        <WvTrustScore score={score} size={compact ? "sm" : "md"} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-wv-muted">Trust score</p>
          <p className="text-lg font-semibold text-wv-foreground">{label}</p>
          {trajectoryLabel && (
            <p className="mt-1 text-xs text-wv-subtle">Trend: {trajectoryLabel}</p>
          )}

          {badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {badges.map((b) => (
                <span
                  key={b.id}
                  className="rounded-full border border-wv-border bg-wv-surface/80 px-2.5 py-0.5 text-xs text-wv-muted"
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}

          {!compact && explanation.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-wv-subtle mb-2">
                Why?
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
