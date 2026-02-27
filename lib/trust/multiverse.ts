/**
 * Multiverse Trust Simulation — local-only, reversible.
 * Enabled for superadmin via MULTIVERSE_MODE.
 */

export type SimulationDelta = {
  addedReviews: unknown[];
  removedReviewIds: string[];
  thresholdOverride?: number;
};

export type UniverseId = string;

export type Universe = {
  id: UniverseId;
  name: string;
  createdAt: number;
  parentId: UniverseId | null;
  /** Full timeline; current state = timeline[timeline.length - 1] or default. */
  timeline: SimulationDelta[];
  /** Optional metadata for visualization: instability, fraud flags. */
  meta?: {
    instability?: number;
    divergenceFromRoot?: number;
    lastMutation?: "inject" | "mutate" | "backdate" | "delete" | "collapse" | "consensus" | null;
  };
};

export const DEFAULT_DELTA: SimulationDelta = {
  addedReviews: [],
  removedReviewIds: [],
};

/** Only true when caller passes superadmin (e.g. from useAuth().role). No env/global — gate at runtime. */
export function isMultiverseMode(role: string | null): boolean {
  return role === "superadmin";
}

export function createUniverse(
  name: string,
  parentId: UniverseId | null,
  initialTimeline: SimulationDelta[] = [JSON.parse(JSON.stringify(DEFAULT_DELTA))]
): Universe {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    parentId,
    timeline: initialTimeline.map((d) => JSON.parse(JSON.stringify(d))),
  };
}

export function getCurrentDelta(universe: Universe): SimulationDelta {
  if (universe.timeline.length === 0) return { ...DEFAULT_DELTA };
  return universe.timeline[universe.timeline.length - 1] as SimulationDelta;
}

export function pushToTimeline(universe: Universe, delta: SimulationDelta): Universe {
  return {
    ...universe,
    timeline: [...universe.timeline, JSON.parse(JSON.stringify(delta))],
  };
}
