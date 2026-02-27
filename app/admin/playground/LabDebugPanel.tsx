"use client";

import type { SimulationAction } from "@/lib/trust/simulationActions";
import type { SimulationDelta, EngineOutputs } from "@/lib/trust/types";

type Props = {
  lastAction: SimulationAction | null;
  lastDelta: SimulationDelta | null;
  lastEngineOutputs: EngineOutputs | null | undefined;
  snapshotCount: number;
  universeId: string | null;
  visible: boolean;
};

export function LabDebugPanel({
  lastAction,
  lastDelta,
  lastEngineOutputs,
  snapshotCount,
  universeId,
  visible,
}: Props) {
  if (!visible) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 text-sm space-y-3">
      <h3 className="font-semibold text-amber-900">Debug — Trust Simulation Engine</h3>
      <div>
        <span className="text-slate-600">Snapshot count:</span>{" "}
        <span className="font-mono font-semibold">{snapshotCount}</span>
      </div>
      <div>
        <span className="text-slate-600">Universe ID:</span>{" "}
        <span className="font-mono text-xs">{universeId ?? "—"}</span>
      </div>
      <div>
        <span className="text-slate-600">Last action:</span>
        <pre className="mt-1 p-2 bg-white border rounded text-xs overflow-auto max-h-24">
          {lastAction ? JSON.stringify(lastAction, null, 2) : "—"}
        </pre>
      </div>
      <div>
        <span className="text-slate-600">Last delta (applied):</span>
        <pre className="mt-1 p-2 bg-white border rounded text-xs overflow-auto max-h-24">
          {lastDelta ? JSON.stringify(lastDelta, null, 2) : "—"}
        </pre>
      </div>
      <div>
        <span className="text-slate-600">Last engine outputs (all engines run):</span>
        <pre className="mt-1 p-2 bg-white border rounded text-xs overflow-auto max-h-32">
          {lastEngineOutputs
            ? JSON.stringify(lastEngineOutputs, null, 2)
            : "—"}
        </pre>
      </div>
    </div>
  );
}
