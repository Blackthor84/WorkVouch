import type { Snapshot, SimulationDelta } from "../domain";
import type { EngineContext } from "../engineContext";
import { getThreshold } from "../engineContext";

/**
 * Pure: risk score from distance below threshold and signal inconsistency.
 */
export function riskEngine(
  snapshot: Snapshot,
  delta: SimulationDelta,
  ctx: EngineContext | undefined,
  trustScore: number
): number {
  const threshold = getThreshold(ctx);
  const belowThreshold = Math.max(0, threshold - trustScore);
  const weights = snapshot.reviews.map((r) => r.weight);
  const variance = weights.length > 1
    ? weights.reduce((s, w) => s + (w - trustScore / 10) ** 2, 0) / weights.length
    : 0;
  const raw = belowThreshold * 0.5 + Math.min(50, variance * 2);
  return Math.min(100, Math.max(0, Math.round(raw)));
}
