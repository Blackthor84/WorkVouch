"use client";

import { useState, useCallback } from "react";
import type { SimulationDelta } from "@/lib/trust/types";
import type { SimLike } from "@/lib/trust/simLike";
import type { SimulationAction } from "@/lib/trust/simulationActions";
import { executeAction } from "@/lib/trust/simulationActions";

type Props = {
  sim: SimLike;
  execute?: (action: SimulationAction) => boolean | { ok: boolean };
};

export function GroupHiringSimulator({ sim, execute: executeProp }: Props) {
  const [choice, setChoice] = useState<"A" | "B" | "partial" | null>(null);
  const [partialCount, setPartialCount] = useState(10);
  const [notes, setNotes] = useState("");

  const run = useCallback(
    (delta: SimulationDelta, label: string) => {
      const action: SimulationAction = {
        type: "group_hiring_apply",
        delta: { ...delta, timestamp: Date.now() },
        notes: notes || label,
      };
      (executeProp ? executeProp(action) : executeAction(sim, action));
    },
    [sim, executeProp, notes]
  );

  const hireA = useCallback(() => {
    run(
      { addedReviews: [{ id: "group-a", source: "supervisor", weight: 1.5, timestamp: Date.now() }] },
      "Group hiring: Candidate A"
    );
    setChoice("A");
  }, [run]);

  const hireB = useCallback(() => {
    run(
      { addedReviews: [{ id: "group-b", source: "peer", weight: 1, timestamp: Date.now() }] },
      "Group hiring: Candidate B"
    );
    setChoice("B");
  }, [run]);

  const partialHire = useCallback(() => {
    run(
      {
        addedReviews: Array.from({ length: Math.min(partialCount, 50) }, (_, i) => ({
          id: `partial-${i}`,
          source: "supervisor" as const,
          weight: 1,
          timestamp: Date.now(),
        })),
      },
      `Partial hire: ${partialCount} of 50`
    );
    setChoice("partial");
  }, [run, partialCount]);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Group hiring simulator</h2>
      <p className="text-sm text-slate-600">
        Simulate hiring Candidate A vs B, or a group (e.g. 20 nurses), or partial hires (e.g. 10 of 50). Each decision applies as a delta and pushes a new snapshot.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={hireA}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          Hire Candidate A
        </button>
        <button
          type="button"
          onClick={hireB}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          Hire Candidate B
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <label className="text-sm">
          Partial hire count (e.g. 10 of 50):
          <input
            type="number"
            min={1}
            max={50}
            value={partialCount}
            onChange={(e) => setPartialCount(Number(e.target.value) || 10)}
            className="ml-2 w-16 border rounded px-2 py-1"
          />
        </label>
        <button
          type="button"
          onClick={partialHire}
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          Apply partial hire
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Decision notes (rationale)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Compliance threshold met; risk accepted"
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      {choice && (
        <p className="text-sm text-slate-600">
          Last choice: <strong>{choice}</strong>. Check timeline and graphs for downstream impact (avg trust, threshold violations, audit risk).
        </p>
      )}
    </section>
  );
}
