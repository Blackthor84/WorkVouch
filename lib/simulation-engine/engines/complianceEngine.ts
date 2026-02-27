import type { Snapshot, SimulationDelta } from "../domain";
import type { EngineContext } from "../engineContext";
import { getThreshold } from "../engineContext";

/**
 * Pure: compliance = meeting threshold; breach probability inverse.
 */
export function complianceEngine(
  snapshot: Snapshot,
  delta: SimulationDelta,
  ctx: EngineContext | undefined,
  trustScore: number
): number {
  const threshold = getThreshold(ctx);
  const breach = Math.max(0, threshold - trustScore);
  const raw = 100 - breach * 2;
  return Math.min(100, Math.max(0, Math.round(raw)));
}
