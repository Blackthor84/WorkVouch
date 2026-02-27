/**
 * Multiverse Trust Simulation — local-only, reversible.
 * Timeline is Snapshot[]; deltas are applied via applyDelta, never pushed directly.
 */

import type { Snapshot, SimulationDelta } from "./types";
import { applyDelta, createInitialSnapshot } from "./applyDelta";

export type { SimulationDelta } from "./types";
export type UniverseId = string;

export type Universe = {
  id: UniverseId;
  name: string;
  createdAt: number;
  parentId: UniverseId | null;
  timeline: Snapshot[];
  meta?: {
    instability?: number;
    divergenceFromRoot?: number;
    lastMutation?: "inject" | "mutate" | "backdate" | "delete" | "collapse" | "consensus" | null;
  };
};

const DEFAULT_SNAPSHOT = createInitialSnapshot(0);

export function snapshotToDelta(s: Snapshot): SimulationDelta {
  return {
    addedReviews: [...s.reviews],
    removedReviewIds: [],
  };
}

export function getSnapshotAt(universe: Universe, index: number): Snapshot {
  if (universe.timeline.length === 0) return DEFAULT_SNAPSHOT;
  const i = Math.max(0, Math.min(index, universe.timeline.length - 1));
  return universe.timeline[i];
}

/** Only true when caller passes superadmin (e.g. from useAuth().role). No env/global — gate at runtime. */
export function isMultiverseMode(role: string | null): boolean {
  return role === "superadmin";
}

export function createUniverse(
  name: string,
  parentId: UniverseId | null,
  initialTimeline: Snapshot[] = [createInitialSnapshot()]
): Universe {
  return {
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    parentId,
    timeline: initialTimeline.length > 0 ? initialTimeline.map((s) => ({ ...s, reviews: [...s.reviews] })) : [createInitialSnapshot()],
  };
}

export function getCurrentSnapshot(universe: Universe): Snapshot {
  if (universe.timeline.length === 0) return DEFAULT_SNAPSHOT;
  return universe.timeline[universe.timeline.length - 1];
}

export function getCurrentDelta(universe: Universe): SimulationDelta {
  return snapshotToDelta(getCurrentSnapshot(universe));
}

export function pushToTimeline(universe: Universe, delta: SimulationDelta): Universe {
  const prev = getCurrentSnapshot(universe);
  const next = applyDelta(prev, delta);
  return {
    ...universe,
    timeline: [...universe.timeline, next],
  };
}
