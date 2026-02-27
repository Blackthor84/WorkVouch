import type { Snapshot, SimulationDelta } from "../domain";

/**
 * Pure: trust debt = trust rising faster than evidence.
 * Accumulates when confidence is low but trust is high; compounds.
 */
export function trustDebtEngine(
  snapshot: Snapshot,
  delta: SimulationDelta,
  trustScore: number,
  confidenceScore: number
): number {
  const evidenceRatio = Math.min(1, confidenceScore / 100);
  const trustRatio = trustScore / 100;
  const gap = Math.max(0, trustRatio - evidenceRatio);
  const debt = gap * 50;
  const decayMult = delta.intentModifiers?.decayMultiplier ?? 1;
  return Math.min(100, Math.max(0, Math.round(debt * decayMult)));
}
