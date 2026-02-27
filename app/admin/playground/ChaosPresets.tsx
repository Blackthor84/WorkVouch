"use client";

import { useCallback } from "react";
import type { SimLike } from "@/lib/trust/simLike";
import type { SimulationAction } from "@/lib/trust/simulationActions";
import { executeAction } from "@/lib/trust/simulationActions";

type Props = {
  sim: SimLike;
  onOutcome?: (presetName: string, message: string) => void;
  execute?: (action: SimulationAction) => boolean | { ok: boolean };
};

const PRESETS: { name: string; action: SimulationAction; message: string }[] = [
  { name: "Glassdoor Attack", action: { type: "chaos_glassdoor", count: 5 }, message: "Glassdoor Attack: 5 negative peer signals injected." },
  { name: "Zombie Startup", action: { type: "chaos_zombie" }, message: "Zombie Startup: threshold collapsed, single weak signal." },
  { name: "Perfect Fraud", action: { type: "chaos_fraud" }, message: "Perfect Fraud: backdated strong supervisor + 2 peer signals." },
];

export function ChaosPresets({ sim, onOutcome, execute: executeProp }: Props) {
  const run = useCallback(
    (name: string, action: SimulationAction, message: string) => {
      (executeProp ? executeProp(action) : executeAction(sim, action));
      onOutcome?.(name, message);
    },
    [sim, onOutcome, executeProp]
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Chaos presets</h2>
      <p className="text-sm text-slate-600 mb-3">One-click scenario scripts. Outcomes are local and reversible.</p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ name, action, message }) => (
          <button
            key={name}
            type="button"
            onClick={() => run(name, action, message)}
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
