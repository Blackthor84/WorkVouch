/**
 * Unified action executor for the Trust Simulation Lab.
 * Every lab button MUST call executeAction; no button may call setDelta, setSnapshot, or mutate state directly.
 * Every action produces a SimulationDelta and commits with force: true (new snapshot always pushed).
 */

import type { SimulationDelta, Review, Snapshot } from "./types";
import type { SimLike } from "./simLike";
import { createReview } from "@/lib/simulation/reviewFactory";

/** Action types that produce a single delta and push a new snapshot. */
export type SimulationAction =
  | { type: "inject_signal"; weight?: number }
  | { type: "mutate_signal" }
  | { type: "backdate_signal"; daysBack?: number }
  | { type: "delete_last_signal" }
  | { type: "trust_collapse" }
  | { type: "fake_consensus"; count?: number }
  | { type: "chaos_glassdoor"; count?: number }
  | { type: "chaos_zombie" }
  | { type: "chaos_fraud" }
  | { type: "add_review"; review: Review }
  | { type: "remove_review"; reviewId: string }
  | { type: "set_threshold"; value: number }
  | { type: "bulk_delta"; delta: SimulationDelta }
  | { type: "save_snapshot" }
  | { type: "replay_scenario"; delta: SimulationDelta }
  | { type: "group_hiring_apply"; delta: SimulationDelta; notes?: string }
  | { type: "decision_trainer_apply"; delta: SimulationDelta; rationale?: string };

/** Canonical union of action type strings — single source of truth for UI labels. */
export type SimulationActionType = SimulationAction["type"];

export const ACTION_LABELS: Record<SimulationActionType, string> = {
  trust_collapse: "Trust collapse",
  fake_consensus: "Fake consensus",
  inject_signal: "Inject signal",
  mutate_signal: "Mutate signal",
  backdate_signal: "Backdate signal",
  delete_last_signal: "Delete signal",
  chaos_glassdoor: "Glassdoor attack",
  chaos_zombie: "Zombie startup",
  chaos_fraud: "Perfect fraud",
  add_review: "Add review",
  remove_review: "Remove review",
  set_threshold: "Set threshold",
  bulk_delta: "Bulk delta",
  save_snapshot: "Save snapshot",
  replay_scenario: "Replay scenario",
  group_hiring_apply: "Group hiring applied",
  decision_trainer_apply: "Decision applied",
};

function snapshotToDelta(snapshot: Snapshot): SimulationDelta {
  return {
    addedReviews: [...snapshot.reviews],
    removedReviewIds: [],
  };
}

/**
 * Build the SimulationDelta for a given action from current sim state.
 * Used by executeAction; does not mutate.
 */
export function actionToDelta(sim: SimLike, action: SimulationAction): SimulationDelta | null {
  const current = sim.delta ?? snapshotToDelta(sim.snapshot);
  const ts = Date.now();

  switch (action.type) {
    case "inject_signal": {
      const weight = action.weight ?? 2;
      return {
        timestamp: ts,
        addedReviews: [createReview({ source: "supervisor", weight })],
        metadata: { actionType: "inject_signal", actor: "lab", notes: "God mode: inject signal" },
      };
    }
    case "mutate_signal": {
      const reviews: Review[] = current.addedReviews ?? [];
      if (reviews.length === 0) return null;
      const mutated = reviews.map((r) =>
        r.id.startsWith("god-") ? { ...r, weight: (r.weight ?? 1) + 1 } : r
      );
      return {
        timestamp: ts,
        addedReviews: mutated,
        removedReviewIds: current.removedReviewIds ?? [],
        metadata: { actionType: "mutate_signal", actor: "lab", notes: "God mode: mutate signal" },
      };
    }
    case "backdate_signal": {
      const reviews: Review[] = current.addedReviews ?? [];
      const daysBack = action.daysBack ?? 30;
      const backdated = reviews.map((r) => ({
        ...r,
        timestamp: (r.timestamp ?? ts) - 86400000 * daysBack,
      }));
      return {
        timestamp: ts,
        addedReviews: backdated,
        removedReviewIds: current.removedReviewIds ?? [],
        metadata: { actionType: "backdate_signal", actor: "lab", notes: "God mode: backdate signal" },
      };
    }
    case "delete_last_signal": {
      const reviews: Review[] = current.addedReviews ?? [];
      if (reviews.length === 0) return null;
      const last = reviews[reviews.length - 1];
      return {
        timestamp: ts,
        removedReviewIds: [last.id],
        metadata: { actionType: "delete_last_signal", actor: "lab", notes: "God mode: delete last signal" },
      };
    }
    case "trust_collapse": {
      const ids = (current.addedReviews ?? []).map((r) => r.id).filter(Boolean);
      return {
        timestamp: ts,
        addedReviews: [],
        removedReviewIds: ids,
        thresholdOverride: 0,
        metadata: { actionType: "trust_collapse", actor: "lab", notes: "God mode: trust collapse" },
      };
    }
    case "fake_consensus": {
      const base: Review[] = current.addedReviews ?? [];
      const count = action.count ?? 3;
      const fake: Review[] = Array.from({ length: count }, () =>
        createReview({ source: "synthetic", weight: 0.9 })
      );
      return {
        timestamp: ts,
        addedReviews: [...base, ...fake],
        removedReviewIds: current.removedReviewIds ?? [],
        metadata: { actionType: "fake_consensus", actor: "lab", notes: "God mode: fake consensus" },
      };
    }
    case "chaos_glassdoor": {
      const n = action.count ?? 5;
      const addedReviews = Array.from({ length: n }, (_, i) => ({
        id: `glassdoor-${ts}-${i}`,
        source: "peer" as const,
        weight: 1,
        timestamp: ts - i * 86400000,
      }));
      return {
        timestamp: ts,
        addedReviews,
        metadata: { actionType: "chaos_glassdoor", actor: "lab", notes: "Chaos: Glassdoor attack" },
      };
    }
    case "chaos_zombie": {
      const removedReviewIds = (current.addedReviews ?? []).map((r) => r.id).filter(Boolean);
      const addedReviews: Review[] = [
        {
          id: `zombie-${ts}`,
          source: "supervisor",
          weight: 0.5,
          timestamp: ts,
        },
      ];
      return {
        timestamp: ts,
        addedReviews,
        removedReviewIds,
        thresholdOverride: 0,
        metadata: { actionType: "chaos_zombie", actor: "lab", notes: "Chaos: Zombie startup" },
      };
    }
    case "chaos_fraud": {
      const addedReviews: Review[] = [
        { id: `fraud-supervisor-${ts}`, source: "supervisor", weight: 2, timestamp: ts - 86400000 * 60 },
        { id: `fraud-peer-1-${ts}`, source: "peer", weight: 1, timestamp: ts - 86400000 * 30 },
        { id: `fraud-peer-2-${ts}`, source: "peer", weight: 1, timestamp: ts - 86400000 * 14 },
      ];
      return {
        timestamp: ts,
        addedReviews,
        metadata: { actionType: "chaos_fraud", actor: "lab", notes: "Chaos: Perfect fraud" },
      };
    }
    case "add_review":
      return {
        timestamp: ts,
        addedReviews: [action.review],
        metadata: { actionType: "add_review", actor: "lab", notes: "Reality: add review" },
      };
    case "remove_review":
      return {
        timestamp: ts,
        removedReviewIds: [action.reviewId],
        metadata: { actionType: "remove_review", actor: "lab", notes: "Reality: remove review" },
      };
    case "set_threshold":
      return {
        timestamp: ts,
        thresholdOverride: action.value,
        metadata: { actionType: "set_threshold", actor: "lab", notes: `Threshold override: ${action.value}` },
      };
    case "bulk_delta":
      return { ...action.delta, timestamp: action.delta.timestamp ?? ts };
    case "save_snapshot": {
      const d = snapshotToDelta(sim.snapshot);
      return { ...d, timestamp: ts, metadata: { actionType: "save_snapshot", actor: "lab", notes: "Save scenario snapshot" } };
    }
    case "group_hiring_apply":
      return {
        ...action.delta,
        timestamp: action.delta.timestamp ?? ts,
        notes: action.notes,
        metadata: { actionType: "group_hiring_apply", actor: "lab", notes: action.notes },
      };
    case "decision_trainer_apply":
      return {
        ...action.delta,
        timestamp: action.delta.timestamp ?? ts,
        notes: action.rationale,
        metadata: { actionType: "decision_trainer_apply", actor: "lab", notes: action.rationale },
      };
    case "replay_scenario":
      return null;
    default:
      return null;
  }
}

function isReplayAction(action: SimulationAction): action is SimulationAction & { type: "replay_scenario" } {
  return action.type === "replay_scenario";
}

export type ExecuteActionResult = { ok: boolean; delta?: SimulationDelta };

/**
 * Single execution path for all lab actions.
 * Every button must call this; no direct setDelta/setSnapshot/mutation.
 * Always commits with force: true so a new snapshot is pushed (except replay, which replaces timeline).
 * Returns the committed delta when ok, for audit/debug.
 */
export function executeAction(sim: SimLike, action: SimulationAction): ExecuteActionResult {
  if (isReplayAction(action)) {
    if (sim.replayScenario) {
      sim.replayScenario(action.delta);
      return { ok: true, delta: action.delta };
    }
    sim.commitDelta(action.delta, { force: true });
    return { ok: true, delta: action.delta };
  }
  let delta = actionToDelta(sim, action);
  if (!delta) {
    const noEffectReason =
      action.type === "mutate_signal"
        ? "No effect: no signals to mutate"
        : action.type === "delete_last_signal"
          ? "No effect: no signals to delete"
          : "No effect: condition not met";
    delta = {
      timestamp: Date.now(),
      metadata: { actionType: action.type, actor: "lab", universeId: null, notes: noEffectReason },
    };
  }
  sim.commitDelta(delta, { force: true });
  return { ok: true, delta };
}
