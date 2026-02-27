/**
 * PopulationSimulationEngine: operates on arrays of employees (snapshots).
 * Computes average trust, variance, tail risk, concentration risk, fragility amplification, compliance breach probability.
 * Every population change generates deltas per employee and rolls up into population-level metrics.
 */

import type { Snapshot } from "./domain";

export interface PopulationMetrics {
  averageTrust: number;
  varianceTrust: number;
  tailRisk: number;
  concentrationRisk: number;
  fragilityAmplification: number;
  complianceBreachProbability: number;
  count: number;
}

function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
}

export function computePopulationMetrics(snapshots: Snapshot[]): PopulationMetrics {
  if (snapshots.length === 0) {
    return {
      averageTrust: 0,
      varianceTrust: 0,
      tailRisk: 0,
      concentrationRisk: 0,
      fragilityAmplification: 0,
      complianceBreachProbability: 0,
      count: 0,
    };
  }
  const trustScores = snapshots.map((s) => s.trustScore);
  const avg = trustScores.reduce((a, b) => a + b, 0) / trustScores.length;
  const varTrust = variance(trustScores);
  const sorted = [...trustScores].sort((a, b) => a - b);
  const bottom10Pct = Math.floor(snapshots.length * 0.1) || 1;
  const tailAvg = sorted.slice(0, bottom10Pct).reduce((a, b) => a + b, 0) / bottom10Pct;
  const tailRisk = Math.max(0, 100 - tailAvg);

  const fragilities = snapshots.map((s) => s.engineOutputs?.fragilityScore ?? 0);
  const avgFragility = fragilities.reduce((a, b) => a + b, 0) / fragilities.length;
  const fragilityVariance = variance(fragilities);
  const fragilityAmplification = avgFragility * (1 + Math.min(1, fragilityVariance / 100));

  const compliances = snapshots.map((s) => s.engineOutputs?.complianceScore ?? 100);
  const breachCount = compliances.filter((c) => c < 60).length;
  const complianceBreachProbability = snapshots.length === 0 ? 0 : breachCount / snapshots.length;

  const topTrust = sorted[sorted.length - 1] ?? 0;
  const concentration = topTrust > 0 ? (sorted.reduce((s, v) => s + v, 0) / sorted.length) / topTrust : 0;
  const concentrationRisk = (1 - Math.min(1, concentration)) * 100;

  return {
    averageTrust: Math.round(avg * 10) / 10,
    varianceTrust: Math.round(varTrust * 100) / 100,
    tailRisk: Math.round(tailRisk * 10) / 10,
    concentrationRisk: Math.round(concentrationRisk * 10) / 10,
    fragilityAmplification: Math.round(fragilityAmplification * 10) / 10,
    complianceBreachProbability: Math.round(complianceBreachProbability * 1000) / 1000,
    count: snapshots.length,
  };
}
