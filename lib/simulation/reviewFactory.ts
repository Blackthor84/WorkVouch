import type { Review, ReviewSource } from "@/lib/trust/types";

/**
 * Type-safe factory for simulation reviews. Use instead of ad-hoc objects.
 */
export function createReview(params: {
  source: ReviewSource;
  weight: number;
  timestamp?: number;
  id?: string;
}): Review {
  return {
    id: params.id ?? `${params.source}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    source: params.source,
    weight: params.weight,
    timestamp: params.timestamp ?? Date.now(),
  };
}
