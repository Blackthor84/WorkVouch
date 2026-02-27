"use client";

import { useState, useCallback } from "react";
import type { SimulationDelta, Review, Snapshot } from "./types";
import { applyDelta, createInitialSnapshot } from "./applyDelta";

export type { SimulationDelta, Review, Snapshot } from "./types";

function snapshotToDelta(snapshot: Snapshot): SimulationDelta {
  return {
    addedReviews: [...snapshot.reviews],
    removedReviewIds: [],
  };
}

export function useSimulation() {
  const initial = createInitialSnapshot();
  const [history, setHistory] = useState<Snapshot[]>([initial]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const snapshot = history[currentIndex] ?? initial;

  const setSnapshot = useCallback((s: Snapshot) => {
    const idx = history.findIndex((h) => h.timestamp === s.timestamp && h.reviews.length === s.reviews.length);
    if (idx >= 0) setCurrentIndex(idx);
  }, [history]);

  const setSnapshotByIndex = useCallback((index: number) => {
    if (index >= 0 && index < history.length) setCurrentIndex(index);
  }, [history.length]);

  const setDelta = useCallback(
    (delta: SimulationDelta) => {
      const next = applyDelta(snapshot, { ...delta, timestamp: delta.timestamp ?? Date.now() });
      setHistory((prev) => [...prev.slice(0, currentIndex + 1), next]);
      setCurrentIndex((prev) => prev + 1);
    },
    [snapshot, currentIndex]
  );

  const addReview = useCallback(
    (review: Review) => {
      setDelta({ addedReviews: [review], timestamp: Date.now() });
    },
    [setDelta]
  );

  const removeReview = useCallback(
    (id: string) => {
      setDelta({ removedReviewIds: [id], timestamp: Date.now() });
    },
    [setDelta]
  );

  const removeLastAddedReview = useCallback(() => {
    if (snapshot.reviews.length === 0) return;
    const last = snapshot.reviews[snapshot.reviews.length - 1];
    setDelta({ removedReviewIds: [last.id], timestamp: Date.now() });
  }, [snapshot.reviews, setDelta]);

  const setThreshold = useCallback(
    (_value: number) => {
      setDelta({ thresholdOverride: _value, timestamp: Date.now() });
    },
    [setDelta]
  );

  const saveSnapshot = useCallback(() => {
    const copy: Snapshot = {
      ...snapshot,
      timestamp: Date.now(),
    };
    setHistory((prev) => [...prev.slice(0, currentIndex + 1), copy]);
    setCurrentIndex((prev) => prev + 1);
  }, [snapshot, currentIndex]);

  const reset = useCallback(() => {
    const empty = createInitialSnapshot();
    setHistory([empty]);
    setCurrentIndex(0);
  }, []);

  const replayScenario = useCallback((delta: SimulationDelta) => {
    const next = applyDelta(initial, { ...delta, timestamp: Date.now() });
    setHistory([initial, next]);
    setCurrentIndex(1);
  }, []);

  return {
    snapshot,
    history,
    currentIndex,
    setSnapshot,
    setSnapshotByIndex,
    setDelta,
    addReview,
    removeReview,
    removeLastAddedReview,
    setThreshold,
    saveSnapshot,
    reset,
    replayScenario,
    delta: snapshotToDelta(snapshot),
  };
}
