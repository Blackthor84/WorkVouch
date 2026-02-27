"use client";

/**
 * Multiverse Lab hook — Phases 1–12.
 * GOD_MODE when role === "superadmin". Local-only, reversible.
 */

import { useState, useCallback } from "react";
import type { Universe, UniverseId, TrustSignal, PerspectiveLens, DecisionOverride } from "./types";
import {
  createUniverse,
  forkUniverseAt,
  resetUniverse,
  applySignal,
  trustCollapse,
  fakeConsensusInjection,
  supervisorOverride,
  timeTravelTo,
  trustDebtCollectionEvent,
  createAuditEntry,
  computeTrustDebt,
  computeFragility,
} from "./engine";
import type { AuditEntry } from "./types";
import { PRESETS, type PresetName } from "./chaosPresets";
import { runCounterfactual, runTrustAutopsy } from "./counterfactual";
import { breakTheMultiverse } from "./breakMultiverse";

export const GOD_MODE_ENABLED = (role: string | null) => role === "superadmin";

export function useMultiverseLab(role: string | null) {
  const godMode = GOD_MODE_ENABLED(role);

  const [universes, setUniverses] = useState<Universe[]>(() => [
    createUniverse("Prime", null),
  ]);
  const [activeId, setActiveId] = useState<UniverseId | null>(() => universes[0]?.id ?? null);
  const [timelineStep, setTimelineStep] = useState(0);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [lens, setLens] = useState<PerspectiveLens>("recruiter");
  const [adversarialMode, setAdversarialMode] = useState(false);
  const [decisionOverride, setDecisionOverride] = useState<DecisionOverride>(null);

  const active = universes.find((u) => u.id === activeId);
  const activeState = active?.trustState ?? { trustScore: 0, confidenceScore: 0, signals: [] };
  const trustDebt = active ? computeTrustDebt(active.timeline) : 0;
  const fragility = computeFragility(activeState);

  const addAudit = useCallback((entry: AuditEntry) => {
    setAuditTrail((prev) => [...prev, entry]);
  }, []);

  const updateUniverse = useCallback((id: UniverseId, fn: (u: Universe) => Universe) => {
    setUniverses((prev) => prev.map((u) => (u.id === id ? fn(u) : u)));
  }, []);

  const fork = useCallback(() => {
    if (!active) return;
    const at = active.timeline[active.timeline.length - 1]?.at ?? Date.now();
    const newU = forkUniverseAt(active, at);
    setUniverses((prev) => [...prev, newU]);
    setActiveId(newU.id);
    setTimelineStep(0);
  }, [active]);

  const destroy = useCallback((id: UniverseId) => {
    setUniverses((prev) => prev.filter((u) => u.id !== id));
    setActiveId((current) => (current === id ? (universes.find((u) => u.id !== id)?.id ?? null) : current));
  }, [universes]);

  const reset = useCallback(() => {
    if (!active) return;
    updateUniverse(active.id, (u) => resetUniverse(u));
    addAudit(createAuditEntry(active.id, "reset", {}));
  }, [active, updateUniverse, addAudit]);

  const injectSignal = useCallback(
    (signal: TrustSignal) => {
      if (!active) return;
      const id = createAuditEntry(active.id, "inject_signal", signal).id;
      updateUniverse(active.id, (u) => applySignal(u, signal, { action: "inject", auditId: id }));
      addAudit(createAuditEntry(active.id, "inject_signal", signal, `Score: ${activeState.trustScore}`));
    },
    [active, activeState.trustScore, updateUniverse, addAudit]
  );

  const doTrustCollapse = useCallback(() => {
    if (!active) return;
    const id = createAuditEntry(active.id, "trust_collapse", {}).id;
    updateUniverse(active.id, (u) => trustCollapse(u, id));
    addAudit(createAuditEntry(active.id, "trust_collapse", {}, "Score forced to 0"));
  }, [active, updateUniverse, addAudit]);

  const doFakeConsensus = useCallback(
    (count: number) => {
      if (!active) return;
      const id = createAuditEntry(active.id, "fake_consensus", { count }).id;
      updateUniverse(active.id, (u) => fakeConsensusInjection(u, count, id));
      addAudit(createAuditEntry(active.id, "fake_consensus", { count }));
    },
    [active, updateUniverse, addAudit]
  );

  const doSupervisorOverride = useCallback(
    (weight: number) => {
      if (!active) return;
      const id = createAuditEntry(active.id, "supervisor_override", { weight }).id;
      updateUniverse(active.id, (u) => supervisorOverride(u, weight, id));
      addAudit(createAuditEntry(active.id, "supervisor_override", { weight }));
    },
    [active, updateUniverse, addAudit]
  );

  const doTimeTravel = useCallback(
    (step: number) => {
      if (!active) return;
      updateUniverse(active.id, (u) => timeTravelTo(u, step));
      setTimelineStep(step);
      addAudit(createAuditEntry(active.id, "time_travel", { step }));
    },
    [active, updateUniverse, addAudit]
  );

  const doDebtCollection = useCallback(() => {
    if (!active) return;
    const id = createAuditEntry(active.id, "debt_collection", {}).id;
    updateUniverse(active.id, (u) => trustDebtCollectionEvent(u, id));
    addAudit(createAuditEntry(active.id, "debt_collection", {}, `Debt: ${trustDebt.toFixed(1)}`));
  }, [active, trustDebt, updateUniverse, addAudit]);

  const runPreset = useCallback(
    (name: PresetName) => {
      if (!active) return null;
      const result = PRESETS[name](active);
      setUniverses(result.universes);
      setActiveId(result.universes[0]?.id ?? null);
      addAudit(createAuditEntry(active.id, `preset_${name}`, {}, result.narrative));
      return result;
    },
    [active, addAudit]
  );

  const counterfactual = active ? runCounterfactual(active) : null;
  const autopsy = active ? runTrustAutopsy(active) : null;

  const breakMultiverse = useCallback(() => {
    if (!active) return null;
    const result = breakTheMultiverse(active);
    setUniverses(result.universes);
    setActiveId(result.universes[0]?.id ?? null);
    addAudit(createAuditEntry(active.id, "break_multiverse", {}, result.narrative));
    return result;
  }, [active, addAudit]);

  return {
    godMode,
    universes,
    activeId,
    active,
    activeState,
    setActiveId,
    timelineStep,
    setTimelineStep,
    trustDebt,
    fragility,
    auditTrail,
    lens,
    setLens,
    adversarialMode,
    setAdversarialMode,
    decisionOverride,
    setDecisionOverride,
    fork,
    destroy,
    reset,
    injectSignal,
    doTrustCollapse,
    doFakeConsensus,
    doSupervisorOverride,
    doTimeTravel,
    doDebtCollection,
    runPreset,
    counterfactual,
    autopsy,
    breakMultiverse,
  };
}
