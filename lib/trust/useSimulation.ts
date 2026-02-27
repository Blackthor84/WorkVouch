"use client";

import { useState } from "react";

export type SimulationDelta = {
  addedReviews: any[];
  removedReviewIds: string[];
  thresholdOverride?: number;
};

export function useSimulation() {
  const [delta, setDelta] = useState<SimulationDelta>({
    addedReviews: [],
    removedReviewIds: [],
  });

  return {
    delta,

    addReview(review: any) {
      setDelta((d) => ({
        ...d,
        addedReviews: [...d.addedReviews, review],
      }));
    },

    removeReview(id: string) {
      setDelta((d) => ({
        ...d,
        removedReviewIds: [...d.removedReviewIds, id],
      }));
    },

    removeLastAddedReview() {
      setDelta((d) => ({
        ...d,
        addedReviews: d.addedReviews.slice(0, -1),
      }));
    },

    setThreshold(value: number) {
      setDelta((d) => ({
        ...d,
        thresholdOverride: value,
      }));
    },

    reset() {
      setDelta({
        addedReviews: [],
        removedReviewIds: [],
      });
    },
  };
}
