/**
 * Reducer pipeline: applyDelta(prevSnapshot, delta) => new Snapshot.
 * 1) Apply review mutations (add/remove)
 * 2) Apply intent modifiers (no engine skip)
 * 3) Run all engines IN ORDER; attach engineOutputs to snapshot.
 * NO ENGINE MAY BE SKIPPED.
 */

import type { Snapshot, SimulationDelta, Review, EngineOutputs, HumanFactorModifiers } from "./domain";
import type { EngineContext } from "./engineContext";
import { computeHumanFactorInsights } from "./humanFactors";
import {
  trustScoreEngine,
  confidenceEngine,
  riskEngine,
  fragilityEngine,
  trustDebtEngine,
  complianceEngine,
  cultureImpactEngine,
} from "./engines";

export function applyDelta(
  prev: Snapshot,
  delta: SimulationDelta,
  ctx: EngineContext | undefined = undefined
): Snapshot {
  let reviews: Review[] = [...prev.reviews];

  if (delta.removedReviewIds && delta.removedReviewIds.length > 0) {
    reviews = reviews.filter((r) => !delta.removedReviewIds!.includes(r.id));
  }
  if (delta.addedReviews && delta.addedReviews.length > 0) {
    reviews = reviews.concat(delta.addedReviews);
  }

  const networkStrength = reviews.length;
  const baseSnapshot: Snapshot = {
    timestamp: delta.timestamp ?? Date.now(),
    reviews,
    trustScore: 0,
    confidenceScore: 0,
    networkStrength,
    metadata: delta.metadata ?? prev.metadata,
  };

  const humanFactorInsights = computeHumanFactorInsights(baseSnapshot, baseSnapshot.timestamp);
  const modifiers: HumanFactorModifiers = humanFactorInsights.modifiers;

  const trustScore = delta.scoreOverride ?? trustScoreEngine(baseSnapshot, delta, ctx);
  const confidenceScore = confidenceEngine(baseSnapshot, delta, modifiers);
  const riskScore = riskEngine(baseSnapshot, delta, ctx, trustScore, modifiers);
  const fragilityScore = fragilityEngine(baseSnapshot, delta, trustScore, modifiers);
  const trustDebt = trustDebtEngine(baseSnapshot, delta, trustScore, confidenceScore, modifiers);
  const complianceScore = complianceEngine(baseSnapshot, delta, ctx, trustScore, modifiers);
  const cultureImpactScore = cultureImpactEngine(baseSnapshot, delta, modifiers);

  const engineOutputs: EngineOutputs = {
    trustScore,
    confidenceScore,
    riskScore,
    fragilityScore,
    trustDebt,
    complianceScore,
    cultureImpactScore,
    humanFactorInsights,
  };

  return {
    ...baseSnapshot,
    trustScore,
    confidenceScore,
    engineOutputs,
  };
}

export function createInitialSnapshot(timestamp?: number): Snapshot {
  const t = timestamp ?? Date.now();
  return {
    timestamp: t,
    reviews: [],
    trustScore: 0,
    confidenceScore: 0,
    networkStrength: 0,
    engineOutputs: {
      trustScore: 0,
      confidenceScore: 0,
      riskScore: 0,
      fragilityScore: 0,
      trustDebt: 0,
      complianceScore: 0,
      cultureImpactScore: 0,
    },
  };
}
