import type { Snapshot, SimulationDelta, HumanFactorModifiers } from "../domain";

/**
 * Pure: trust debt = trust rising faster than evidence.
 * Ethical friction (modifiers) increases trust debt accumulation.
 */
export function trustDebtEngine(
  snapshot: Snapshot,
  delta: SimulationDelta,
  trustScore: number,
  confidenceScore: number,
  modifiers?: HumanFactorModifiers
): number {
  const evidenceRatio = Math.min(1, confidenceScore / 100);
  const trustRatio = trustScore / 100;
  const gap = Math.max(0, trustRatio - evidenceRatio);
  let debt = gap * 50;
  const decayMult = delta.intentModifiers?.decayMultiplier ?? 1;
  debt *= decayMult;
  if (modifiers) debt *= modifiers.trustDebtMultiplier;
  return Math.min(100, Math.max(0, Math.round(debt)));
}
