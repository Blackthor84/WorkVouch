import type { SimulationDelta, Snapshot } from "@/lib/trust/types";

export type SimLike = {
  snapshot: Snapshot;
  history: Snapshot[];

  setDelta: (delta: SimulationDelta) => void;
  commitDelta: (delta: SimulationDelta, options?: { force?: boolean }) => void;
  setSnapshot: (snapshot: Snapshot) => void;

  applyToActive: (fn: (delta: SimulationDelta) => SimulationDelta) => void;

  setTimelineStep: (step: number) => void;

  addReview: (r: unknown) => void;
  removeReview: (id: string) => void;
  setThreshold: (n: number) => void;
  delta: SimulationDelta | null;
  /** Replace timeline with [initial, applyDelta(initial, delta)]. Optional (multiverse/single sim provide it). */
  replayScenario?: (delta: SimulationDelta) => void;
}
