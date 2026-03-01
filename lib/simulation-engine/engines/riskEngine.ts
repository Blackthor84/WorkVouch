import type { Snapshot, SimulationDelta, HumanFactorModifiers } from "../domain";
import type { EngineContext } from "../engineContext";
import { getThreshold } from "../engineContext";

/**
 * Pure: risk score from distance below threshold and signal inconsistency.
 * Collaboration stability (modifiers) reduces downside risk / volatility.
 */
export function riskEngine(
  snapshot: Snapshot,
  delta: SimulationDelta,
  ctx: EngineContext | undefined,
  trustScore: number,
  modifiers?: HumanFactorModifiers
): number {
  const threshold = getThreshold(ctx);
  const belowThreshold = Math.max(0, threshold - trustScore);
  const weights = snapshot.reviews.map((r) => r.weight);
  const variance = weights.length > 1
    ? weights.reduce((s, w) => s + (w - trustScore / 10) ** 2, 0) / weights.length
    : 0;
  let raw = belowThreshold * 0.5 + Math.min(50, variance * 2);
  if (modifiers) raw = Math.max(0, raw * (1 - modifiers.riskVolatilityReduction));
  return Math.min(100, Math.max(0, Math.round(raw)));
}
