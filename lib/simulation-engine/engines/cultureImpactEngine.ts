import type { Snapshot, SimulationDelta } from "../domain";

/**
 * Pure: culture impact from network strength and balance of sources.
 */
export function cultureImpactEngine(
  snapshot: Snapshot,
  delta: SimulationDelta
): number {
  const n = snapshot.reviews.length;
  const peerCount = snapshot.reviews.filter((r) => r.source === "peer").length;
  const supervisorCount = snapshot.reviews.filter((r) => r.source === "supervisor").length;
  const balance = n === 0 ? 0 : 1 - Math.abs(peerCount - supervisorCount) / n;
  const raw = n * 3 + balance * 30;
  return Math.min(100, Math.max(0, Math.round(raw)));
}
