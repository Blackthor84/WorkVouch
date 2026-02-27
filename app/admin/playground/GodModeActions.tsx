"use client";

import { useCallback } from "react";

type SimLike = {
  addReview: (r: unknown) => void;
  removeReview: (id: string) => void;
  setDelta: (d: unknown) => void;
  setThreshold: (n: number) => void;
  delta: { addedReviews: unknown[]; removedReviewIds: string[] };
  applyToActive?: (fn: (d: unknown) => unknown) => void;
};

type Props = {
  sim: SimLike;
  onAction?: () => void;
};

export function GodModeActions({ sim, onAction }: Props) {
  const run = useCallback((fn: () => void) => {
    fn();
    onAction?.();
  }, [onAction]);

  const injectSignal = useCallback(() => {
    run(() => {
    sim.addReview({
      id: `god-inject-${Date.now()}`,
      source: "supervisor",
      weight: 2,
      timestamp: Date.now(),
    });
  });
  }, [sim, run]);

  const mutateSignal = useCallback(() => {
    run(() => {
    const reviews = (sim.delta?.addedReviews ?? []) as { id: string; weight?: number }[];
    if (reviews.length === 0) return;
    const mutated = reviews.map((r) =>
      r.id.startsWith("god-")
        ? { ...r, weight: (r.weight ?? 1) + 1 }
        : r
    );
    sim.setDelta({
      ...sim.delta,
      addedReviews: mutated,
      removedReviewIds: sim.delta?.removedReviewIds ?? [],
    });
  });
  }, [sim, run]);

  const backdateSignal = useCallback(() => {
    run(() => {
    const reviews = (sim.delta?.addedReviews ?? []) as { id: string; timestamp?: number }[];
    const backdated = reviews.map((r) => ({
      ...r,
      timestamp: (r.timestamp ?? Date.now()) - 86400000 * 30,
    }));
    sim.setDelta({
      ...sim.delta,
      addedReviews: backdated,
      removedReviewIds: sim.delta?.removedReviewIds ?? [],
    });
  });
  }, [sim, run]);

  const deleteLastSignal = useCallback(() => {
    run(() => {
    const reviews = (sim.delta?.addedReviews ?? []) as { id: string }[];
    if (reviews.length === 0) return;
    const last = reviews[reviews.length - 1];
    sim.removeReview(last.id);
  });
  }, [sim, run]);

  const trustCollapse = useCallback(() => {
    run(() => {
    sim.setThreshold(0);
    sim.setDelta({
      addedReviews: [],
      removedReviewIds: (sim.delta?.addedReviews ?? []).map((r: { id?: string }) => r.id).filter(Boolean) as string[],
    });
  });
  }, [sim, run]);

  const fakeConsensus = useCallback(() => {
    run(() => {
    const base = (sim.delta?.addedReviews ?? []) as unknown[];
    const fake = [
      { id: `god-consensus-${Date.now()}-1`, source: "peer", weight: 1, timestamp: Date.now() },
      { id: `god-consensus-${Date.now()}-2`, source: "peer", weight: 1, timestamp: Date.now() },
      { id: `god-consensus-${Date.now()}-3`, source: "supervisor", weight: 1, timestamp: Date.now() },
    ];
    sim.setDelta({
      ...sim.delta,
      addedReviews: [...base, ...fake],
      removedReviewIds: sim.delta?.removedReviewIds ?? [],
    });
  });
  }, [sim, run]);

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50/80 p-4">
      <h3 className="text-sm font-semibold text-amber-900 mb-2">God Mode Actions</h3>
      <p className="text-xs text-amber-800 mb-3">Inject, mutate, backdate, or delete signals. Trust collapse and fake consensus.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={injectSignal}
          className="rounded border border-amber-600 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200"
        >
          Inject Signal
        </button>
        <button
          type="button"
          onClick={mutateSignal}
          className="rounded border border-amber-600 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200"
        >
          Mutate Signal
        </button>
        <button
          type="button"
          onClick={backdateSignal}
          className="rounded border border-amber-600 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200"
        >
          Backdate Signal
        </button>
        <button
          type="button"
          onClick={deleteLastSignal}
          className="rounded border border-amber-600 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200"
        >
          Delete Last Signal
        </button>
        <button
          type="button"
          onClick={trustCollapse}
          className="rounded border border-red-600 bg-red-100 px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-200"
        >
          Trust Collapse
        </button>
        <button
          type="button"
          onClick={fakeConsensus}
          className="rounded border border-amber-600 bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-200"
        >
          Fake Consensus
        </button>
      </div>
    </div>
  );
}
