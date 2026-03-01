import type { Snapshot, SimulationDelta, HumanFactorModifiers } from "../domain";

/**
 * Pure: confidence from review count and source diversity.
 * Human error reduces effective confidence. Relational trust (modifiers) increases stability.
 */
export function confidenceEngine(
  snapshot: Snapshot,
  delta: SimulationDelta,
  modifiers?: HumanFactorModifiers
): number {
  const n = snapshot.reviews.length;
  const sources = new Set(snapshot.reviews.map((r) => r.source)).size;
  const humanError = delta.intentModifiers?.humanErrorRate ?? 0;
  let base = Math.min(100, n * 8 + sources * 5);
  const penalty = base * humanError * 0.5;
  base = base - penalty;
  if (modifiers) base *= modifiers.confidenceStabilityMultiplier;
  return Math.min(100, Math.max(0, Math.round(base)));
}
