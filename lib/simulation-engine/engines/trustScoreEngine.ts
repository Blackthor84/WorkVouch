import type { Snapshot, SimulationDelta, Review } from "../domain";
import type { EngineContext } from "../engineContext";
import { getSupervisorWeight } from "../engineContext";

/**
 * Pure: computes trust score from reviews.
 * Supervisor weight and intent/error modifiers alter effective weights.
 */
export function trustScoreEngine(
  snapshot: Snapshot,
  delta: SimulationDelta,
  ctx: EngineContext | undefined
): number {
  const reviews = snapshot.reviews;
  const supervisorWeight = delta.intentModifiers?.supervisorWeightOverride ?? getSupervisorWeight(ctx);
  const intentBias = delta.intentModifiers?.intentBias ?? 1;
  const humanError = delta.intentModifiers?.humanErrorRate ?? 0;

  let sum = 0;
  for (let i = 0; i < reviews.length; i++) {
    const r = reviews[i];
    let w = r.weight;
    if (r.source === "supervisor") w *= supervisorWeight;
    w *= intentBias;
    const deterministicNoise = 1 - humanError * (((r.timestamp + i) % 100) / 50 - 1);
    sum += w * Math.max(0.1, deterministicNoise);
  }
  const raw = sum * 10;
  return Math.min(100, Math.max(0, Math.round(raw)));
}
