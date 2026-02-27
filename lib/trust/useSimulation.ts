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

  const [history, setHistory] = useState<SimulationDelta[]>([]);

  return {
    delta,
    history,

    setDelta(next: SimulationDelta) {
      setDelta(() => next);
    },

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

    saveSnapshot() {
      setHistory((h) => [...h, JSON.parse(JSON.stringify(delta))]);
    },

    reset() {
      setDelta({
        addedReviews: [],
        removedReviewIds: [],
      });
    },
  };
}
