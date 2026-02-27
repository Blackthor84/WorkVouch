/**
 * Reducer: apply a delta to the previous snapshot to produce the next snapshot.
 * Delegates to the simulation engine; ALL engines run (trust, confidence, risk, fragility, debt, compliance, culture).
 * History stores Snapshots only. No engine may be skipped.
 */

import type { Snapshot, SimulationDelta, Review } from "./types";
import { applyDelta as engineApplyDelta, createInitialSnapshot as engineCreateInitialSnapshot } from "@/lib/simulation-engine";

function toEngineReview(r: Review): { id: string; source: Review["source"]; weight: number; timestamp: number } {
  return { id: r.id, source: r.source, weight: r.weight, timestamp: r.timestamp };
}

function toEngineSnapshot(prev: Snapshot): {
  timestamp: number;
  reviews: { id: string; source: Review["source"]; weight: number; timestamp: number }[];
  trustScore: number;
  confidenceScore: number;
  networkStrength: number;
  metadata?: Snapshot["metadata"];
} {
  return {
    timestamp: prev.timestamp,
    reviews: prev.reviews.map(toEngineReview),
    trustScore: prev.trustScore,
    confidenceScore: prev.confidenceScore,
    networkStrength: prev.networkStrength,
    metadata: prev.metadata
      ? {
          actionType: prev.metadata.actionType ?? "unknown",
          actor: prev.metadata.actor ?? "system",
          universeId: prev.metadata.universeId ?? null,
          notes: prev.metadata.notes,
        }
      : undefined,
  };
}

function toEngineDelta(delta: SimulationDelta): {
  timestamp?: number;
  addedReviews?: { id: string; source: Review["source"]; weight: number; timestamp: number }[];
  removedReviewIds?: string[];
  thresholdOverride?: number;
  scoreOverride?: number;
  intentModifiers?: { humanErrorRate?: number; intentBias?: number; decayMultiplier?: number; supervisorWeightOverride?: number };
  notes?: string;
  metadata?: { actionType: string; actor: string; universeId: string | null; notes?: string };
} {
  return {
    timestamp: delta.timestamp,
    addedReviews: delta.addedReviews?.map(toEngineReview),
    removedReviewIds: delta.removedReviewIds,
    thresholdOverride: delta.thresholdOverride,
    scoreOverride: delta.scoreOverride,
    intentModifiers: delta.intentModifiers
      ? {
          humanErrorRate: typeof delta.intentModifiers.humanErrorRate === "number" ? delta.intentModifiers.humanErrorRate : undefined,
          intentBias: typeof delta.intentModifiers.intentBias === "number" ? delta.intentModifiers.intentBias : undefined,
          decayMultiplier: typeof delta.intentModifiers.decayMultiplier === "number" ? delta.intentModifiers.decayMultiplier : undefined,
          supervisorWeightOverride: typeof delta.intentModifiers.supervisorWeightOverride === "number" ? delta.intentModifiers.supervisorWeightOverride : undefined,
        }
      : undefined,
    notes: delta.notes,
    metadata: delta.metadata
      ? { actionType: delta.metadata.actionType ?? "unknown", actor: delta.metadata.actor ?? "system", universeId: delta.metadata.universeId ?? null, notes: delta.metadata.notes }
      : undefined,
  };
}

function fromEngineSnapshot(next: ReturnType<typeof engineApplyDelta>): Snapshot {
  return {
    timestamp: next.timestamp,
    reviews: next.reviews as Review[],
    trustScore: next.trustScore,
    confidenceScore: next.confidenceScore,
    networkStrength: next.networkStrength,
    metadata: next.metadata,
    engineOutputs: next.engineOutputs,
  };
}

export function applyDelta(prev: Snapshot, delta: SimulationDelta): Snapshot {
  const enginePrev = toEngineSnapshot(prev) as Parameters<typeof engineApplyDelta>[0];
  const engineDelta = toEngineDelta(delta) as Parameters<typeof engineApplyDelta>[1];
  const next = engineApplyDelta(enginePrev, engineDelta);
  return fromEngineSnapshot(next);
}

export function createInitialSnapshot(timestamp?: number): Snapshot {
  const next = engineCreateInitialSnapshot(timestamp);
  return fromEngineSnapshot(next);
}
