/**
 * WorkVouch Simulation Engine – main entry.
 * Runs a full simulation from inputs to unified output. No I/O, no hooks.
 */

import type { SimulationInputs, SimulationOutput } from "./types";
import {
  getPlanLimits,
  calculateRehireProbability,
  calculateTeamCompatibility,
  calculateWorkforceRisk,
  calculateAdROI,
} from "./calculations";

/**
 * Runs a full simulation: plan limits, over-limit, subscription state, and all metrics.
 * Pure logic only – no Supabase, NextAuth, Stripe, or database access.
 */
export function runSimulation(input: SimulationInputs): SimulationOutput {
  const limits = getPlanLimits(input.plan);

  const overLimit =
    input.reportsUsed > limits.reports ||
    input.searchesUsed > limits.searches ||
    input.seats > limits.seats;

  const subscriptionExpired = !input.subscriptionActive;

  const rehireProbability = calculateRehireProbability(
    input.reportsUsed,
    input.searchesUsed
  );

  const teamCompatibilityScore = calculateTeamCompatibility(input.seats);

  const workforceRiskScore = calculateWorkforceRisk(input.reportsUsed);

  const output: SimulationOutput = {
    allowedReports: limits.reports,
    allowedSearches: limits.searches,
    seatsAllowed: limits.seats,
    overLimit,
    subscriptionExpired,
    rehireProbability,
    teamCompatibilityScore,
    workforceRiskScore,
  };

  if (
    input.advertiserImpressions !== undefined &&
    input.advertiserImpressions > 0 &&
    input.advertiserCTR !== undefined
  ) {
    const { clicks, estimatedRevenue, roi } = calculateAdROI(
      input.advertiserImpressions,
      input.advertiserCTR
    );
    output.estimatedClicks = clicks;
    output.estimatedRevenue = estimatedRevenue;
    output.estimatedAdROI = roi;
  }

  return output;
}
