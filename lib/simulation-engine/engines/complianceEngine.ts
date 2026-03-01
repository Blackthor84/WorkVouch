import type { Snapshot, SimulationDelta, HumanFactorModifiers } from "../domain";
import type { EngineContext } from "../engineContext";
import { getThreshold } from "../engineContext";

/**
 * Pure: compliance = meeting threshold; breach probability inverse.
 * Ethical friction (modifiers) increases compliance risk probability.
 */
export function complianceEngine(
  snapshot: Snapshot,
  delta: SimulationDelta,
  ctx: EngineContext | undefined,
  trustScore: number,
  modifiers?: HumanFactorModifiers
): number {
  const threshold = getThreshold(ctx);
  const breach = Math.max(0, threshold - trustScore);
  let raw = 100 - breach * 2;
  if (modifiers) raw /= modifiers.complianceRiskMultiplier;
  return Math.min(100, Math.max(0, Math.round(raw)));
}
