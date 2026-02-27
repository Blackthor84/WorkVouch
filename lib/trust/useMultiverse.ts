"use client";

import { useState, useCallback } from "react";
import type { SimulationDelta, Review, Snapshot } from "./types";
import {
  type Universe,
  type UniverseId,
  createUniverse,
  getCurrentDelta,
  getSnapshotAt,
  snapshotToDelta,
  pushToTimeline,
} from "./multiverse";
import { createInitialSnapshot, applyDelta } from "./applyDelta";

function cloneDelta(d: SimulationDelta): SimulationDelta {
  return {
    addedReviews: d.addedReviews ? [...d.addedReviews] : [],
    removedReviewIds: d.removedReviewIds ? [...d.removedReviewIds] : [],
    thresholdOverride: d.thresholdOverride,
  };
}

function snapshotDeepEqual(a: Snapshot, b: Snapshot): boolean {
  if (a.timestamp !== b.timestamp || a.reviews.length !== b.reviews.length) return false;
  return a.reviews.every((r, i) => {
    const s = b.reviews[i];
    return s && r.id === s.id && r.source === s.source && r.weight === s.weight && r.timestamp === s.timestamp;
  });
}

export function useMultiverse() {
  const [universes, setUniverses] = useState<Universe[]>(() => [
    createUniverse("Prime", null, [createInitialSnapshot()]),
  ]);
  const [activeUniverseId, setActiveUniverseIdState] = useState<UniverseId | null>(
    () => universes[0]?.id ?? null
  );
  const [timelineStepIndex, setTimelineStepIndex] = useState<number>(0);

  const activeUniverse = universes.find((u) => u.id === activeUniverseId);
  const safeStep = activeUniverse
    ? Math.min(timelineStepIndex, Math.max(0, activeUniverse.timeline.length - 1))
    : 0;
  const currentSnapshot: Snapshot = activeUniverse ? getSnapshotAt(activeUniverse, safeStep) : createInitialSnapshot();
  const delta: SimulationDelta = snapshotToDelta(currentSnapshot);
  const history: Snapshot[] = activeUniverse?.timeline ?? [];

  const applyToActive = useCallback(
    (fn: (current: SimulationDelta) => SimulationDelta) => {
      if (!activeUniverse) return;
      const current = getCurrentDelta(activeUniverse);
      const next = fn(current);
      setUniverses((prev) =>
        prev.map((u) =>
          u.id === activeUniverseId ? pushToTimeline(u, next) : u
        )
      );
      setTimelineStepIndex(activeUniverse.timeline.length);
    },
    [activeUniverse, activeUniverseId]
  );

  const setDelta = useCallback(
    (next: SimulationDelta) => {
      applyToActive(() => cloneDelta(next));
    },
    [applyToActive]
  );

  const commitDelta = useCallback(
    (delta: SimulationDelta, options: { force?: boolean } = {}) => {
      if (!activeUniverse) return;
      const { force = false } = options;
      const current = currentSnapshot;
      const next = applyDelta(current, { ...delta, timestamp: delta.timestamp ?? Date.now() });
      if (force || !snapshotDeepEqual(next, current)) {
        setUniverses((prev) =>
          prev.map((u) =>
            u.id === activeUniverseId ? { ...u, timeline: [...u.timeline, next] } : u
          )
        );
        setTimelineStepIndex(activeUniverse.timeline.length);
      }
    },
    [activeUniverse, activeUniverseId, currentSnapshot]
  );

  const addReview = useCallback(
    (review: unknown) => {
      applyToActive((d) => ({
        ...d,
        addedReviews: [...(d.addedReviews ?? []), review as Review],
      }));
    },
    [applyToActive]
  );

  const removeReview = useCallback(
    (id: string) => {
      applyToActive((d) => ({
        ...d,
        removedReviewIds: [...(d.removedReviewIds ?? []), id],
      }));
    },
    [applyToActive]
  );

  const removeLastAddedReview = useCallback(() => {
    applyToActive((d) => ({
      ...d,
      addedReviews: (d.addedReviews ?? []).slice(0, -1),
    }));
  }, [applyToActive]);

  const setThreshold = useCallback(
    (value: number) => {
      applyToActive((d) => ({ ...d, thresholdOverride: value }));
    },
    [applyToActive]
  );

  const saveSnapshot = useCallback(() => {
    applyToActive((d) => cloneDelta(d));
  }, [applyToActive]);

  const reset = useCallback(() => {
    applyToActive(() => ({ addedReviews: [], removedReviewIds: [] }));
  }, [applyToActive]);

  const fork = useCallback(() => {
    if (!activeUniverse) return;
    const newUniverse = createUniverse(
      `${activeUniverse.name} (fork)`,
      activeUniverse.id,
      activeUniverse.timeline.map((s) => ({ ...s, reviews: [...s.reviews] }))
    );
    setUniverses((prev) => [...prev, newUniverse]);
    setActiveUniverseIdState(newUniverse.id);
  }, [activeUniverse]);

  const merge = useCallback((targetId: UniverseId, sourceId: UniverseId) => {
    const source = universes.find((u) => u.id === sourceId);
    if (!source) return;
    setUniverses((prev) =>
      prev.map((u) =>
        u.id === targetId
          ? { ...u, timeline: source.timeline.map((s) => ({ ...s, reviews: [...s.reviews] })) }
          : u
      )
    );
  }, [universes]);

  const destroy = useCallback((id: UniverseId) => {
    const remaining = universes.filter((u) => u.id !== id);
    setUniverses((prev) => prev.filter((u) => u.id !== id));
    if (activeUniverseId === id) {
      setActiveUniverseIdState(remaining[0]?.id ?? null);
    }
  }, [universes, activeUniverseId]);

  const setActiveUniverseId = useCallback((id: UniverseId | null) => {
    setActiveUniverseIdState(id);
    const u = universes.find((x) => x.id === id);
    setTimelineStepIndex(u ? Math.max(0, u.timeline.length - 1) : 0);
  }, [universes]);

  const setTimelineStep = useCallback((step: number) => {
    setTimelineStepIndex(step);
  }, []);

  const setSnapshot = useCallback((s: Snapshot) => {
    if (!activeUniverse) return;
    const idx = activeUniverse.timeline.findIndex((h) => h.timestamp === s.timestamp && h.reviews.length === s.reviews.length);
    if (idx >= 0) setTimelineStepIndex(idx);
  }, [activeUniverse]);

  const replayScenario = useCallback(
    (delta: SimulationDelta) => {
      if (!activeUniverse) return;
      const initial = createInitialSnapshot();
      const next = applyDelta(initial, delta);
      setUniverses((prev) =>
        prev.map((u) =>
          u.id === activeUniverseId ? { ...u, timeline: [initial, next] } : u
        )
      );
      setTimelineStepIndex(1);
    },
    [activeUniverse, activeUniverseId]
  );

  return {
    snapshot: currentSnapshot,
    delta,
    history,
    setDelta,
    commitDelta,
    setSnapshot,
    setSnapshotByIndex: setTimelineStep,
    addReview,
    removeReview,
    removeLastAddedReview,
    setThreshold,
    saveSnapshot,
    reset,
    universes,
    activeUniverseId,
    activeUniverse,
    setActiveUniverseId,
    fork,
    merge,
    destroy,
    applyToActive,
    replayScenario,
    timelineStepIndex: safeStep,
    setTimelineStep,
  };
}
