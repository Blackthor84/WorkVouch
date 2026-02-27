"use client";

import { useCallback } from "react";
import type { SimulationDelta } from "@/lib/trust/types";

type SimLike = {
  setDelta: (d: SimulationDelta) => void;
  addReview: (r: unknown) => void;
  setThreshold: (n: number) => void;
  delta: SimulationDelta | null;
};

type Props = {
  sim: SimLike;
  onOutcome?: (presetName: string, message: string) => void;
};

/** Glassdoor Attack: flood negative peer-style signals. */
function runGlassdoorAttack(sim: SimLike) {
  const t = Date.now();
  for (let i = 0; i < 5; i++) {
    sim.addReview({
      id: `glassdoor-${t}-${i}`,
      source: "peer",
      weight: 1,
      timestamp: t - i * 86400000,
    });
  }
  return "Glassdoor Attack: 5 negative peer signals injected.";
}

/** Zombie Startup: collapse threshold, minimal signals. */
function runZombieStartup(sim: SimLike) {
  sim.setThreshold(0);
  sim.setDelta({
    addedReviews: [],
    removedReviewIds: (sim.delta?.addedReviews ?? []).map((r) => r.id).filter(Boolean),
  });
  sim.addReview({
    id: `zombie-${Date.now()}`,
    source: "supervisor",
    weight: 0.5,
    timestamp: Date.now(),
  });
  return "Zombie Startup: threshold collapsed, single weak signal.";
}

/** Perfect Fraud: fake consensus + backdated strong signals. */
function runPerfectFraud(sim: SimLike) {
  const t = Date.now();
  sim.addReview({
    id: `fraud-supervisor-${t}`,
    source: "supervisor",
    weight: 2,
    timestamp: t - 86400000 * 60,
  });
  sim.addReview({
    id: `fraud-peer-1-${t}`,
    source: "peer",
    weight: 1,
    timestamp: t - 86400000 * 30,
  });
  sim.addReview({
    id: `fraud-peer-2-${t}`,
    source: "peer",
    weight: 1,
    timestamp: t - 86400000 * 14,
  });
  return "Perfect Fraud: backdated strong supervisor + 2 peer signals.";
}

export function ChaosPresets({ sim, onOutcome }: Props) {
  const run = useCallback(
    (name: string, fn: (s: SimLike) => string) => {
      const message = fn(sim);
      onOutcome?.(name, message);
    },
    [sim, onOutcome]
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">Chaos presets</h2>
      <p className="text-sm text-slate-600 mb-3">One-click scenario scripts. Outcomes are local and reversible.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => run("Glassdoor Attack", runGlassdoorAttack)}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          Glassdoor Attack
        </button>
        <button
          type="button"
          onClick={() => run("Zombie Startup", runZombieStartup)}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          Zombie Startup
        </button>
        <button
          type="button"
          onClick={() => run("Perfect Fraud", runPerfectFraud)}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          Perfect Fraud
        </button>
      </div>
    </div>
  );
}
