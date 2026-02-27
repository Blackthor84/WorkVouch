"use client";

import { useEffect, useState } from "react";
import type { Snapshot } from "@/lib/trust/types";

function complianceLabel(score: number): "Compliant" | "At Risk" | "Non-Compliant" {
  if (score >= 80) return "Compliant";
  if (score >= 60) return "At Risk";
  return "Non-Compliant";
}

export interface UniverseContext {
  name: string;
  id: string | null;
  divergencePercent?: number | null;
  instability?: number | null;
}

type Props = {
  snapshot: Snapshot;
  currentStep: number;
  historyLength: number;
  lastActionLabel: string;
  universeContext: UniverseContext | null;
  multiverseMode: boolean;
  /** Mobile: icons + numbers only; tap opens Command Summary Sheet */
  variant?: "desktop" | "mobile";
  onTap?: () => void;
  /** When true, show brief pulse on last-action area (after an action). */
  lastActionPulse?: boolean;
};

/**
 * Persistent read-only Command Strip. Binds to active Snapshot; updates on every
 * snapshot commit. Mobile: icons + numbers, tap opens sheet. Desktop: full labels.
 */
export function CommandStrip({
  snapshot,
  currentStep,
  historyLength,
  lastActionLabel,
  universeContext,
  multiverseMode,
  variant = "desktop",
  onTap,
  lastActionPulse = false,
}: Props) {
  const [pulse, setPulse] = useState(false);
  const outputs = snapshot.engineOutputs;
  const trustScore = snapshot.trustScore ?? outputs?.trustScore ?? "—";
  const confidenceScore = snapshot.confidenceScore ?? outputs?.confidenceScore ?? "—";
  const compliance =
    outputs != null ? complianceLabel(outputs.complianceScore) : "—";
  const stepMax = Math.max(0, historyLength - 1);
  const stepLabel = stepMax >= 0 ? `${currentStep}/${stepMax}` : "0/0";

  useEffect(() => {
    if (!lastActionPulse) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(t);
  }, [lastActionLabel, lastActionPulse]);

  if (variant === "mobile") {
    const complianceDot =
      compliance === "Compliant"
        ? "bg-emerald-500"
        : compliance === "At Risk"
          ? "bg-amber-500"
          : "bg-red-500";

    return (
      <header
        className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 shadow-sm safe-area-inset-top"
        aria-label="Command strip — tap for summary"
        role="status"
      >
        <button
          type="button"
          onClick={onTap}
          className="flex items-center gap-2 flex-1 min-w-0 flex-nowrap"
          aria-label="Open command summary"
        >
          <span className="text-base shrink-0" aria-hidden>🌌</span>
          <span className="font-mono text-xs font-semibold text-slate-800 truncate max-w-[72px]">
            {universeContext?.name ?? (multiverseMode ? "—" : "Single")}
          </span>
          <span className="text-base shrink-0" aria-hidden>⏱</span>
          <span className="font-mono text-xs font-semibold text-slate-800">{stepLabel}</span>
          <span className="text-base shrink-0" aria-hidden>🧠</span>
          <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">{trustScore}</span>
          <span className={`w-2 h-2 rounded-full shrink-0 ${complianceDot}`} aria-label={compliance} />
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] text-slate-700 truncate max-w-[80px] ${pulse ? "animate-pulse bg-emerald-100 ring-1 ring-emerald-400" : "bg-slate-100"}`}
            title={lastActionLabel}
          >
            🟢 {lastActionLabel}
          </span>
        </button>
      </header>
    );
  }

  return (
    <header
      className="sticky top-0 z-30 flex items-center gap-6 border-b border-slate-200 bg-white px-4 py-2 shadow-sm flex-nowrap overflow-hidden"
      aria-label="Command strip — simulation state (read-only)"
      role="status"
    >
      <div className="flex items-center gap-6 flex-nowrap min-w-0">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Universe</span>
          <span className="font-mono text-sm font-semibold text-slate-800 truncate max-w-[120px]">
            {universeContext?.name ?? (multiverseMode ? "—" : "Single")}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-200 flex-shrink-0" aria-hidden />
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Timeline</span>
          <span className="font-mono text-sm font-semibold text-slate-800">
            Step {currentStep} of {stepMax}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-200 flex-shrink-0" aria-hidden />
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Trust</span>
          <span className="font-mono text-xl font-bold text-slate-900 tabular-nums">{trustScore}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Confidence</span>
          <span className="font-mono text-sm font-semibold text-slate-700 tabular-nums">{confidenceScore}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Compliance</span>
          <span
            className={`text-sm font-semibold ${
              compliance === "Compliant"
                ? "text-emerald-700"
                : compliance === "At Risk"
                  ? "text-amber-700"
                  : "text-red-700"
            }`}
          >
            {compliance}
          </span>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 flex-shrink-0 ml-auto ${pulse ? "animate-pulse" : ""}`}>
        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Last action</span>
        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-sm text-slate-800 truncate max-w-[180px]" title={lastActionLabel}>
          {lastActionLabel}
        </span>
      </div>
    </header>
  );
}
