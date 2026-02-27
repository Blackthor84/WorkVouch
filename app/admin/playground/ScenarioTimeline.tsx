"use client";

import type { Snapshot } from "@/lib/trust/types";

type Props = {
  history: Snapshot[];
  onSelect: (snapshot: Snapshot) => void;
};

export function ScenarioTimeline({ history, onSelect }: Props) {
  if (history.length === 0) return null;
  const max = Math.max(0, history.length - 1);
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900 mb-2">Simulation Timeline</h3>
      <input
        type="range"
        min={0}
        max={max}
        defaultValue={0}
        onChange={(e) => onSelect(history[Number(e.target.value)])}
        className="w-full"
      />
      <p className="text-xs text-slate-500 mt-1">Step 0 – {max} ({history.length} snapshots)</p>
    </div>
  );
}
