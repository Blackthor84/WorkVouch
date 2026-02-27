import type { Snapshot, SimulationDelta } from "../domain";

/**
 * Pure: fragility = sensitivity to perturbation.
 * Same trustScore can have different fragility (e.g. few strong signals vs many weak).
 */
export function fragilityEngine(
  snapshot: Snapshot,
  delta: SimulationDelta,
  trustScore: number
): number {
  const n = snapshot.reviews.length;
  if (n === 0) return 100;
  const avgWeight = snapshot.reviews.reduce((s, r) => s + r.weight, 0) / n;
  const variance = snapshot.reviews.reduce((s, r) => s + (r.weight - avgWeight) ** 2, 0) / n;
  const decayMult = delta.intentModifiers?.decayMultiplier ?? 1;
  const concentration = variance < 1e-6 ? 1 : 1 / (1 + Math.sqrt(variance));
  const raw = (100 - trustScore) * 0.3 + concentration * 40 * decayMult;
  return Math.min(100, Math.max(0, Math.round(raw)));
}
