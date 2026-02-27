"use client";

import { useCallback } from "react";
import type { SimLike } from "@/lib/trust/simLike";
import type { SimulationAction } from "@/lib/trust/simulationActions";
import { executeAction } from "@/lib/trust/simulationActions";

type Props = {
  sim: SimLike;
  onAction?: () => void;
  /** When provided, used instead of executeAction(sim, action) for unified audit. */
  execute?: (action: SimulationAction) => boolean | { ok: boolean };
};

export function GodModeActions({ sim, onAction, execute: executeProp }: Props) {
  const run = useCallback(
    (action: SimulationAction) => {
      const result = executeProp ? executeProp(action) : executeAction(sim, action);
      const ok = typeof result === "boolean" ? result : result.ok;
      if (ok) onAction?.();
    },
    [sim, onAction, executeProp]
  );

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50/80 p-4">
      <h3 className="text-sm font-semibold text-amber-900 mb-2">God Mode Actions</h3>
      <p className="text-xs text-amber-800 mb-3">Inject, mutate, backdate, or delete signals. Trust collapse and fake consensus.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => run({ type: "inject_signal", weight: 2 })}
          className="rounded border border-amber-600 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200"
        >
          Inject Signal
        </button>
        <button
          type="button"
          onClick={() => run({ type: "mutate_signal" })}
          className="rounded border border-amber-600 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200"
        >
          Mutate Signal
        </button>
        <button
          type="button"
          onClick={() => run({ type: "backdate_signal", daysBack: 30 })}
          className="rounded border border-amber-600 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200"
        >
          Backdate Signal
        </button>
        <button
          type="button"
          onClick={() => run({ type: "delete_last_signal" })}
          className="rounded border border-amber-600 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200"
        >
          Delete Last Signal
        </button>
        <button
          type="button"
          onClick={() => run({ type: "trust_collapse" })}
          className="rounded border border-red-600 bg-red-100 px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-200"
        >
          Trust Collapse
        </button>
        <button
          type="button"
          onClick={() => run({ type: "fake_consensus", count: 3 })}
          className="rounded border border-amber-600 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200"
        >
          Fake Consensus
        </button>
      </div>
    </div>
  );
}
