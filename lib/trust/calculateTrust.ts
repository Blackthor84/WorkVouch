import type { TrustSnapshot } from "./types";

/** Immutable: compute trust and confidence from a snapshot (playground/simulation). */
export function calculateTrust(snapshot: TrustSnapshot) {
  const base =
    snapshot.reviews.reduce((sum, r) => sum + r.weight, 0) * 10;

  return {
    trustScore: Math.min(100, base),
    confidenceScore: Math.min(
      100,
      snapshot.reviews.length * 10
    ),
  };
}
