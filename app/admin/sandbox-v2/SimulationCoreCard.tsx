"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface V1BreakdownComponents {
  tenure: number;
  reviewVolume: number;
  sentiment: number;
  rating: number;
  rehireMultiplier: number;
}

interface SimulationCoreCardProps {
  avgScore: number | null;
  breakdown: V1BreakdownComponents | null;
  isAdmin: boolean;
  recalcLoading: boolean;
  currentSandboxId: string | null;
  loading: boolean;
  onRecalculate: () => void;
  sentimentMultiplier: number;
  setSentimentMultiplier: (v: number) => void;
  industryModifiers?: string[];
  lastScoreDelta?: number | null;
  showDeltaBadge?: boolean;
}

export function SimulationCoreCard({
  avgScore,
  breakdown,
  isAdmin,
  recalcLoading,
  currentSandboxId,
  loading,
  onRecalculate,
  sentimentMultiplier,
  setSentimentMultiplier,
  industryModifiers = [],
  lastScoreDelta = null,
  showDeltaBadge = false,
}: SimulationCoreCardProps) {
  const score = avgScore != null ? Math.round(Number(avgScore)) : null;
  const scoreColor =
    score == null
      ? "text-slate-200"
      : score < 40
        ? "text-red-400"
        : score < 70
          ? "text-amber-400"
          : "text-emerald-400";

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">
      <h2 className="text-xl font-bold text-white">Intelligence Engine</h2>

      {/* A) Large Score Gauge + Score Change Indicator */}
      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-6 relative">
        {showDeltaBadge && lastScoreDelta != null && (
          <span
            className={`absolute right-4 top-4 animate-in fade-in rounded-lg px-3 py-1.5 text-lg font-bold ${
              lastScoreDelta >= 0 ? "bg-emerald-600/90 text-white" : "bg-red-600/90 text-white"
            }`}
          >
            {lastScoreDelta >= 0 ? "+" : ""}{lastScoreDelta.toFixed(1)}
          </span>
        )}
        <p className="text-sm font-medium uppercase tracking-wide text-slate-300">Profile Confidence Score</p>
        <p className={`mt-2 text-5xl font-bold ${scoreColor}`}>{score != null ? score : "—"}</p>
        <p className="mt-1 text-xs text-slate-200">0–100 · Sandbox average</p>
      </div>

      {/* B) Score Breakdown (Admin only) */}
      {isAdmin && (
        <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm font-semibold text-slate-300">Score Breakdown (Admin)</p>
          {breakdown ? (
            <ul className="mt-3 space-y-2 text-sm text-white">
              <li className="flex justify-between">
                <span className="text-slate-300">Tenure Strength</span>
                <span>{breakdown.tenure.toFixed(2)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-300">Review Volume Strength</span>
                <span>{breakdown.reviewVolume.toFixed(2)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-300">Sentiment Strength</span>
                <span>{breakdown.sentiment.toFixed(2)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-300">Rating Strength</span>
                <span>{breakdown.rating.toFixed(2)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-300">Rehire Multiplier</span>
                <span>{breakdown.rehireMultiplier.toFixed(2)}</span>
              </li>
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-200">Add employees and recalculate to see breakdown.</p>
          )}
        </div>
      )}

      {/* Industry Modifiers (Admin only) */}
      {isAdmin && industryModifiers.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-sm font-semibold text-slate-300">Industry Modifiers</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {industryModifiers.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {/* C) Large Recalculate Button */}
      <div className="mt-6">
        <Button
          onClick={onRecalculate}
          disabled={loading || !currentSandboxId || recalcLoading}
          className="w-full bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-500"
        >
          {recalcLoading ? "Recalculating…" : "Recalculate Intelligence"}
        </Button>
      </div>

      {/* D) Sentiment Multiplier Slider (Sandbox Only) */}
      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-4">
        <Label className="text-slate-300 font-medium">Sentiment Multiplier: {sentimentMultiplier.toFixed(1)}</Label>
        <input
          type="range"
          min={0.5}
          max={2}
          step={0.1}
          value={sentimentMultiplier}
          onChange={(e) => setSentimentMultiplier(parseFloat(e.target.value))}
          className="mt-2 w-full accent-blue-500"
        />
        <p className="mt-2 text-xs text-slate-200">Sandbox only. Does not affect production.</p>
      </div>
    </section>
  );
}
