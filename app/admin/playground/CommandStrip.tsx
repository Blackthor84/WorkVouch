"use client";

import type { Snapshot } from "@/lib/trust/types";
import type { SimulationAction } from "@/lib/trust/simulationActions";

function complianceLabel(score: number): string {
  if (score >= 80) return "Compliant";
  if (score >= 60) return "At risk";
  return "Breach";
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
};

export function CommandStrip({
  snapshot,
  currentStep,
  historyLength,
  lastActionLabel,
  universeContext,
  multiverseMode,
}: Props) {
  const outputs = snapshot.engineOutputs;
  const trustScore = snapshot.trustScore ?? outputs?.trustScore ?? "—";
  const confidenceScore = snapshot.confidenceScore ?? outputs?.confidenceScore ?? "—";
  const compliance =
    outputs != null ? complianceLabel(outputs.complianceScore) : "—";

  return (
    <header
      className="sticky top-0 z-30 flex flex-wrap items-center gap-4 border-b border-slate-200 bg-white px-4 py-2 shadow-sm"
      aria-label="Command strip — simulation state at a glance"
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase text-slate-500">Universe</span>
          <span className="font-mono text-sm font-semibold text-slate-800">
            {universeContext?.name ?? (multiverseMode ? "—" : "Single")}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-200" aria-hidden />
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase text-slate-500">Step</span>
          <span className="font-mono text-sm font-semibold text-slate-800">
            {currentStep} / {Math.max(0, historyLength - 1)}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-200" aria-hidden />
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase text-slate-500">Trust</span>
          <span className="font-mono text-sm font-semibold text-slate-800">{trustScore}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase text-slate-500">Confidence</span>
          <span className="font-mono text-sm font-semibold text-slate-800">{confidenceScore}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase text-slate-500">Compliance</span>
          <span
            className={`text-sm font-semibold ${
              compliance === "Compliant"
                ? "text-emerald-700"
                : compliance === "At risk"
                  ? "text-amber-700"
                  : "text-red-700"
            }`}
          >
            {compliance}
          </span>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs font-medium uppercase text-slate-500">Last action</span>
        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-sm text-slate-800">
          {lastActionLabel}
        </span>
      </div>
    </header>
  );
}
