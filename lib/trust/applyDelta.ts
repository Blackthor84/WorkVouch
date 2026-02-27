import type { Snapshot, SimulationDelta, Review } from "./types";
import { calculateTrust } from "./calculateTrust";

/**
 * Reducer: apply a delta to the previous snapshot to produce the next snapshot.
 * All simulation actions (chaos presets, god mode, injections) produce deltas
 * and apply through this; history stores Snapshots only.
 */
export function applyDelta(prev: Snapshot, delta: SimulationDelta): Snapshot {
  let reviews: Review[] = [...prev.reviews];

  if (delta.removedReviewIds && delta.removedReviewIds.length > 0) {
    reviews = reviews.filter((r) => !delta.removedReviewIds!.includes(r.id));
  }

  if (delta.addedReviews && delta.addedReviews.length > 0) {
    reviews = reviews.concat(delta.addedReviews);
  }

  const trustSnapshot = { ...prev, reviews };
  const { trustScore, confidenceScore } = calculateTrust(trustSnapshot);
  const networkStrength = reviews.length;

  return {
    timestamp: delta.timestamp ?? Date.now(),
    reviews,
    trustScore,
    confidenceScore,
    networkStrength,
  };
}

/** Create an empty initial snapshot. */
export function createInitialSnapshot(timestamp?: number): Snapshot {
  const t = timestamp ?? Date.now();
  return {
    timestamp: t,
    reviews: [],
    trustScore: 0,
    confidenceScore: 0,
    networkStrength: 0,
  };
}
