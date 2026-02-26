import type { TrustSnapshot, SimulationDelta } from "./types";
import { calculateTrust } from "./calculateTrust";

export function simulateTrust(
  base: TrustSnapshot,
  delta: SimulationDelta
) {
  let reviews = [...base.reviews];

  if (delta.removedReviewIds) {
    reviews = reviews.filter(
      (r) => !delta.removedReviewIds!.includes(r.id)
    );
  }

  if (delta.addedReviews) {
    reviews = reviews.concat(delta.addedReviews);
  }

  const simulatedSnapshot: TrustSnapshot = {
    ...base,
    reviews,
  };

  return calculateTrust(simulatedSnapshot);
}
