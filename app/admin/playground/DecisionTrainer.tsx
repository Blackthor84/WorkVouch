"use client";

import { useState, useCallback } from "react";
import type { SimLike } from "@/lib/trust/simLike";
import type { SimulationAction } from "@/lib/trust/simulationActions";
import { executeAction } from "@/lib/trust/simulationActions";

type Props = {
  sim: SimLike;
  execute?: (action: SimulationAction) => boolean | { ok: boolean };
};

import { ALL_INDUSTRIES, industryLabel, type Industry } from "@/lib/industries";

const PERSPECTIVES = ["Recruiter", "Enterprise Risk", "Regulator"] as const;

export function DecisionTrainer({ sim, execute: executeProp }: Props) {
  const [perspective, setPerspective] = useState<typeof PERSPECTIVES[number]>("Recruiter");
  const [industry, setIndustry] = useState<Industry>("healthcare");
  const [rationale, setRationale] = useState("");
  const [outcome, setOutcome] = useState<string | null>(null);

  const forceHire = useCallback(() => {
    const action: SimulationAction = {
      type: "decision_trainer_apply",
      delta: {
        addedReviews: [{ id: "trainer-hire", source: "supervisor", weight: 2, timestamp: Date.now() }],
        metadata: { actionType: "decision_trainer_force_hire", actor: "lab", notes: rationale },
      },
      rationale: rationale || "Force hire (no correct answer — decision under uncertainty)",
    };
    (executeProp ? executeProp(action) : executeAction(sim, action));
    setOutcome("Force hire applied. Replay later with new information to compare.");
  }, [sim, executeProp, rationale]);

  const forceReject = useCallback(() => {
    const action: SimulationAction = {
      type: "decision_trainer_apply",
      delta: {
        removedReviewIds: (sim.delta?.addedReviews ?? []).map((r) => r.id).slice(0, 1),
        metadata: { actionType: "decision_trainer_force_reject", actor: "lab", notes: rationale },
      },
      rationale: rationale || "Force reject (decision under uncertainty)",
    };
    (executeProp ? executeProp(action) : executeAction(sim, action));
    setOutcome("Force reject applied. Reasonable decisions can still fail — rewind/fork to compare.");
  }, [sim, executeProp, rationale]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Decision trainer (enterprise)</h2>
      <p className="text-sm text-slate-600">
        No &ldquo;correct&rdquo; answers. Force a decision under uncertainty, log rationale, and replay later with new information.
      </p>

      <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Decisions are tied to perspective and industry context. How &ldquo;reasonable&rdquo; decisions still fail is visible after rewind/fork.
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="text-sm">
          Perspective:
          <select
            value={perspective}
            onChange={(e) => setPerspective(e.target.value as typeof PERSPECTIVES[number])}
            className="ml-2 border rounded px-2 py-1"
          >
            {PERSPECTIVES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Industry:
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value as Industry)}
            className="ml-2 border rounded px-2 py-1"
          >
            {ALL_INDUSTRIES.map((i) => (
              <option key={i} value={i}>{industryLabel(i)}</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Rationale (logged for audit)</label>
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          placeholder="Why this decision under uncertainty?"
          rows={2}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={forceHire}
          className="rounded border border-green-600 bg-green-50 px-3 py-2 text-sm text-green-800 hover:bg-green-100"
        >
          Force hire
        </button>
        <button
          type="button"
          onClick={forceReject}
          className="rounded border border-red-600 bg-red-50 px-3 py-2 text-sm text-red-800 hover:bg-red-100"
        >
          Force reject
        </button>
      </div>

      {outcome && <p className="text-sm text-slate-600">{outcome}</p>}
    </section>
  );
}
