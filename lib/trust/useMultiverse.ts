"use client";

import { useState, useCallback } from "react";
import type { SimulationDelta } from "./useSimulation";
import {
  type Universe,
  type UniverseId,
  createUniverse,
  getCurrentDelta,
  pushToTimeline,
  DEFAULT_DELTA,
} from "./multiverse";

function cloneDelta(d: SimulationDelta): SimulationDelta {
  return {
    addedReviews: [...(d.addedReviews ?? [])],
    removedReviewIds: [...(d.removedReviewIds ?? [])],
    thresholdOverride: d.thresholdOverride,
  };
}

export function useMultiverse() {
  const [universes, setUniverses] = useState<Universe[]>(() => [
    createUniverse("Prime", null, [{ ...DEFAULT_DELTA }]),
  ]);
  const [activeUniverseId, setActiveUniverseIdState] = useState<UniverseId | null>(
    () => universes[0]?.id ?? null
  );
  const [timelineStepIndex, setTimelineStepIndex] = useState<number>(0);

  const activeUniverse = universes.find((u) => u.id === activeUniverseId);
  const safeStep = activeUniverse
    ? Math.min(timelineStepIndex, Math.max(0, activeUniverse.timeline.length - 1))
    : 0;
  const delta: SimulationDelta = activeUniverse
    ? (activeUniverse.timeline[safeStep] as SimulationDelta) ?? (getCurrentDelta(activeUniverse) as SimulationDelta)
    : { ...DEFAULT_DELTA };
  const history: SimulationDelta[] = activeUniverse?.timeline ?? [];

  const applyToActive = useCallback(
    (fn: (current: SimulationDelta) => SimulationDelta) => {
      if (!activeUniverse) return;
      const current = (activeUniverse.timeline[safeStep] ?? getCurrentDelta(activeUniverse)) as SimulationDelta;
      const next = fn(current);
      setUniverses((prev) =>
        prev.map((u) =>
          u.id === activeUniverseId ? pushToTimeline(u, next) : u
        )
      );
      setTimelineStepIndex(activeUniverse.timeline.length);
    },
    [activeUniverse, activeUniverseId, safeStep]
  );

  const setDelta = useCallback(
    (next: SimulationDelta) => {
      applyToActive(() => cloneDelta(next));
    },
    [applyToActive]
  );

  const addReview = useCallback(
    (review: unknown) => {
      applyToActive((d) => ({
        ...d,
        addedReviews: [...(d.addedReviews ?? []), review],
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
    applyToActive(() => ({ ...DEFAULT_DELTA }));
  }, [applyToActive]);

  const fork = useCallback(() => {
    if (!activeUniverse) return;
    const current = getCurrentDelta(activeUniverse);
    const newUniverse = createUniverse(
      `${activeUniverse.name} (fork)`,
      activeUniverse.id,
      [...activeUniverse.timeline.map((t) => ({ ...t }))]
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
          ? { ...u, timeline: [...source.timeline.map((t) => ({ ...t }))] }
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

  return {
    delta,
    history,
    setDelta,
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
    timelineStepIndex: safeStep,
    setTimelineStep,
  };
}
