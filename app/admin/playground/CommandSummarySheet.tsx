"use client";

import type { Snapshot, EngineOutputs } from "@/lib/trust/types";
import type { UniverseContext } from "./CommandStrip";

type Props = {
  snapshot: Snapshot;
  lastActionLabel: string;
  explanation: string;
  engineDeltas: { name: string; delta: number }[];
  universeContext: UniverseContext | null;
  currentStep: number;
  historyLength: number;
  onClose: () => void;
};

export function CommandSummarySheet({
  snapshot,
  lastActionLabel,
  explanation,
  engineDeltas,
  universeContext,
  currentStep,
  historyLength,
  onClose,
}: Props) {
  const outputs = snapshot.engineOutputs;
  const stepMax = Math.max(0, historyLength - 1);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white"
      role="dialog"
      aria-label="Command summary — full snapshot and last action"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-slate-900">Command Summary</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Snapshot</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded bg-slate-50 p-2">
              <span className="text-slate-500">Universe</span>
              <div className="font-mono font-semibold">{universeContext?.name ?? "Single"}</div>
            </div>
            <div className="rounded bg-slate-50 p-2">
              <span className="text-slate-500">Step</span>
              <div className="font-mono font-semibold">{currentStep} of {stepMax}</div>
            </div>
            <div className="rounded bg-slate-50 p-2">
              <span className="text-slate-500">Trust</span>
              <div className="font-mono font-semibold">{snapshot.trustScore ?? outputs?.trustScore ?? "—"}</div>
            </div>
            <div className="rounded bg-slate-50 p-2">
              <span className="text-slate-500">Confidence</span>
              <div className="font-mono font-semibold">{snapshot.confidenceScore ?? outputs?.confidenceScore ?? "—"}</div>
            </div>
            {outputs && (
              <>
                <div className="rounded bg-slate-50 p-2">
                  <span className="text-slate-500">Trust debt</span>
                  <div className="font-mono font-semibold">{outputs.trustDebt}</div>
                </div>
                <div className="rounded bg-slate-50 p-2">
                  <span className="text-slate-500">Fragility</span>
                  <div className="font-mono font-semibold">{outputs.fragilityScore}</div>
                </div>
                <div className="rounded bg-slate-50 p-2 col-span-2">
                  <span className="text-slate-500">Compliance</span>
                  <div className="font-semibold">{outputs.complianceScore >= 80 ? "Compliant" : outputs.complianceScore >= 60 ? "At Risk" : "Non-Compliant"}</div>
                </div>
              </>
            )}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Last action</h3>
          <p className="font-mono text-sm text-slate-800 mb-2">{lastActionLabel}</p>
          <p className="text-sm text-slate-600">{explanation}</p>
        </section>

        {engineDeltas.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Engine deltas</h3>
            <ul className="space-y-1 text-sm">
              {engineDeltas.map(({ name, delta }) => (
                <li key={name} className="font-mono">
                  {name}: {delta > 0 ? "+" : ""}{delta}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
