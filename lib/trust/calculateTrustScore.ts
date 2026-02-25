import type { TrustEngineSnapshot } from "./types";

/**
 * Return trust score from engine snapshot (single source of truth).
 */
export function calculateTrustScore(snapshot: TrustEngineSnapshot): number {
  return snapshot.trustScore;
}
