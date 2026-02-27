import type { Snapshot, SimulationDelta } from "../domain";

/**
 * Pure: confidence from review count and source diversity.
 * Human error reduces effective confidence.
 */
export function confidenceEngine(
  snapshot: Snapshot,
  delta: SimulationDelta
): number {
  const n = snapshot.reviews.length;
  const sources = new Set(snapshot.reviews.map((r) => r.source)).size;
  const humanError = delta.intentModifiers?.humanErrorRate ?? 0;
  const base = Math.min(100, n * 8 + sources * 5);
  const penalty = base * humanError * 0.5;
  return Math.min(100, Math.max(0, Math.round(base - penalty)));
}
