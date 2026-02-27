/**
 * Multiverse Trust Simulation Engine.
 * Local-only, reversible. No production data access.
 * Phase 1: Core engine. Phases 3–6: actions, audit, debt, fragility.
 */

import type {
  Universe,
  UniverseId,
  TrustState,
  TrustSignal,
  TimelineEvent,
  PhysicsProfile,
  AuditEntry,
} from "./types";
import { DEFAULT_PHYSICS } from "./types";

// ——— Trust state helpers ———

const emptyState: TrustState = {
  trustScore: 0,
  confidenceScore: 0,
  signals: [],
};

function cloneState(s: TrustState): TrustState {
  return {
    ...s,
    signals: s.signals.map((x) => ({ ...x })),
  };
}

function computeTrustFromSignals(signals: TrustSignal[], physics: PhysicsProfile): TrustState {
  const sum = signals.reduce((a, sig) => a + sig.weight * (physics.verificationWeight ?? 1), 0);
  const count = signals.length;
  const trustScore = count === 0 ? 0 : Math.min(100, Math.max(0, sum * 10 + 50));
  const confidenceScore = Math.min(100, count * 15);
  return {
    trustScore,
    confidenceScore,
    signals: [...signals],
  };
}

// ——— Universe factory ———

export function createUniverse(
  label: string,
  parentId: UniverseId | null,
  options?: { physics?: Partial<PhysicsProfile>; initialState?: TrustState; forkedAt?: number }
): Universe {
  const physics: PhysicsProfile = { ...DEFAULT_PHYSICS, ...options?.physics };
  const state = options?.initialState ? cloneState(options.initialState) : { ...emptyState };
  const at = Date.now();
  const timeline: TimelineEvent[] = [{ at, state: cloneState(state), action: "init" }];
  return {
    id: crypto.randomUUID(),
    label,
    physicsProfile: physics,
    timeline,
    trustState: state,
    createdAt: at,
    parentId,
    forkedAt: options?.forkedAt,
  };
}

// ——— Fork at timestamp (Phase 1) ———

export function forkUniverseAt(universe: Universe, atTimestamp: number): Universe {
  const event = universe.timeline.find((e) => e.at <= atTimestamp) ?? universe.timeline[universe.timeline.length - 1];
  const state = event ? cloneState(event.state) : cloneState(universe.trustState);
  return createUniverse(`${universe.label} (fork)`, universe.id, {
    initialState: state,
    physics: universe.physicsProfile,
    forkedAt: atTimestamp,
  });
}

// ——— Destroy / Reset (Phase 1) ———

export function resetUniverse(universe: Universe): Universe {
  const state = emptyState;
  const at = Date.now();
  return {
    ...universe,
    timeline: [{ at, state: { ...state }, action: "reset" }],
    trustState: state,
  };
}

// ——— Apply signal and advance timeline ———

export function applySignal(
  universe: Universe,
  signal: TrustSignal,
  audit?: { action: string; auditId: string }
): Universe {
  const signals = [...universe.trustState.signals, signal];
  const state = computeTrustFromSignals(signals, universe.physicsProfile);
  const at = Date.now();
  const event: TimelineEvent = {
    at,
    state: cloneState(state),
    action: audit?.action ?? "signal",
    auditId: audit?.auditId,
  };
  return {
    ...universe,
    timeline: [...universe.timeline, event],
    trustState: state,
  };
}

// ——— Phase 3: Reality actions ———

export function trustCollapse(universe: Universe, auditId: string): Universe {
  const state: TrustState = { ...emptyState, trustScore: 0, confidenceScore: 0, signals: [] };
  const at = Date.now();
  const event: TimelineEvent = { at, state, action: "trust_collapse", auditId };
  return {
    ...universe,
    timeline: [...universe.timeline, event],
    trustState: state,
  };
}

export function fakeConsensusInjection(
  universe: Universe,
  count: number,
  auditId: string
): Universe {
  let u = universe;
  const t = Date.now();
  for (let i = 0; i < count; i++) {
    u = applySignal(
      u,
      { id: `consensus-${t}-${i}`, source: "peer", weight: 1, timestamp: t - i * 1000 },
      { action: "fake_consensus", auditId }
    );
  }
  return u;
}

export function supervisorOverride(universe: Universe, weight: number, auditId: string): Universe {
  return applySignal(
    universe,
    { id: `override-${Date.now()}`, source: "supervisor", weight, timestamp: Date.now() },
    { action: "supervisor_override", auditId }
  );
}

export function timeTravelTo(universe: Universe, timelineIndex: number): Universe {
  if (timelineIndex < 0 || timelineIndex >= universe.timeline.length) return universe;
  const event = universe.timeline[timelineIndex];
  return {
    ...universe,
    trustState: cloneState(event.state),
  };
}

// ——— Phase 6: Trust debt & fragility ———

export function computeTrustDebt(timeline: TimelineEvent[]): number {
  let debt = 0;
  for (let i = 1; i < timeline.length; i++) {
    const prev = timeline[i - 1].state.trustScore;
    const curr = timeline[i].state.trustScore;
    if (curr > prev && curr - prev > 5) debt += (curr - prev) * 0.1;
  }
  return Math.min(100, debt);
}

export function computeFragility(state: TrustState): number {
  const n = state.signals.length;
  if (n === 0) return 0;
  const score = state.trustScore;
  return Math.min(100, Math.abs(score - 50) * 0.5 + n * 2);
}

export function trustDebtCollectionEvent(universe: Universe, auditId: string): Universe {
  const debt = computeTrustDebt(universe.timeline);
  const state: TrustState = {
    ...universe.trustState,
    trustScore: Math.max(0, universe.trustState.trustScore - debt),
    trustDebt: 0,
    trustFragility: computeFragility(universe.trustState),
  };
  const at = Date.now();
  const event: TimelineEvent = { at, state, action: "debt_collection", auditId };
  return {
    ...universe,
    timeline: [...universe.timeline, event],
    trustState: state,
  };
}

// ——— Audit ———

export function createAuditEntry(
  universeId: UniverseId,
  action: string,
  payload: unknown,
  outcome?: string
): AuditEntry {
  return {
    id: crypto.randomUUID(),
    at: Date.now(),
    universeId,
    action,
    payload,
    outcome,
  };
}
