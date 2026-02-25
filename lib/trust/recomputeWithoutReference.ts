import { explainTrustScore } from "./explainTrustScore";
import type { TrustEngineSnapshot } from "./types";

/**
 * Sensitivity: "What if we excluded this event from the snapshot?"
 * Returns trust score with that event excluded. In-memory only.
 */
export function recomputeWithoutReference(
  snapshot: TrustEngineSnapshot,
  excludeEventIndex: number
): number {
  const events = snapshot.events.filter((_, i) => i !== excludeEventIndex);
  const reduced: TrustEngineSnapshot = {
    ...snapshot,
    events,
  };
  return explainTrustScore(reduced).trustScore;
}
