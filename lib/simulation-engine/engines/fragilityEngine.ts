import type { Snapshot, SimulationDelta, HumanFactorModifiers } from "../domain";

/**
 * Pure: fragility = sensitivity to perturbation.
 * Human factors: relational trust lowers fragility; ethical friction raises it.
 */
export function fragilityEngine(
  snapshot: Snapshot,
  delta: SimulationDelta,
  trustScore: number,
  modifiers?: HumanFactorModifiers
): number {
  const n = snapshot.reviews.length;
  if (n === 0) return 100;
  const avgWeight = snapshot.reviews.reduce((s, r) => s + r.weight, 0) / n;
  const variance = snapshot.reviews.reduce((s, r) => s + (r.weight - avgWeight) ** 2, 0) / n;
  const decayMult = delta.intentModifiers?.decayMultiplier ?? 1;
  const concentration = variance < 1e-6 ? 1 : 1 / (1 + Math.sqrt(variance));
  let raw = (100 - trustScore) * 0.3 + concentration * 40 * decayMult;
  if (modifiers) raw += modifiers.fragilityAdjustment;
  return Math.min(100, Math.max(0, Math.round(raw)));
}
