/**
 * WorkVouch Simulation Engine – deterministic calculations.
 * No side effects, no I/O. Pure functions only.
 */

import type { PlanTier } from "./types";

export interface PlanLimits {
  reports: number;
  searches: number;
  seats: number;
}

/**
 * Returns plan limits. Custom returns unlimited (Infinity).
 */
export function getPlanLimits(plan: PlanTier): PlanLimits {
  switch (plan) {
    case "free":
    case "starter":
      return { reports: 15, searches: 25, seats: 1 };
    case "pro":
      return { reports: 75, searches: 100, seats: 20 };
    case "custom":
      return { reports: Infinity, searches: Infinity, seats: Infinity };
    default:
      return { reports: 15, searches: 25, seats: 1 };
  }
}

/**
 * Rehire probability 60–98 based on reports and searches activity.
 * More activity => higher score (capped at 98).
 */
export function calculateRehireProbability(
  reportsUsed: number,
  searchesUsed: number
): number {
  const activity = Math.min(reportsUsed + searchesUsed, 200);
  const score = 60 + (activity / 200) * 38;
  return Math.round(Math.min(98, Math.max(60, score)));
}

/**
 * Team compatibility 65–95 based on seats (more seats => higher score).
 */
export function calculateTeamCompatibility(seats: number): number {
  const capped = Math.min(seats, 30);
  const score = 65 + (capped / 30) * 30;
  return Math.round(Math.min(95, Math.max(65, score)));
}

/**
 * Workforce risk 30–70. More reports => lower risk (better visibility).
 */
export function calculateWorkforceRisk(reportsUsed: number): number {
  const capped = Math.min(reportsUsed, 100);
  const score = 70 - (capped / 100) * 40;
  return Math.round(Math.min(70, Math.max(30, score)));
}

/**
 * Ad ROI: clicks = impressions * (ctr/100), revenue = clicks * 4, ROI = revenue / 1000 baseline.
 * Returns ROI as a multiplier (e.g. 2.5 = 250%).
 */
export function calculateAdROI(
  impressions: number,
  ctrPercent: number
): { clicks: number; estimatedRevenue: number; roi: number } {
  if (impressions <= 0) {
    return { clicks: 0, estimatedRevenue: 0, roi: 0 };
  }
  const ctr = ctrPercent / 100;
  const clicks = impressions * ctr;
  const estimatedRevenue = clicks * 4;
  const baselineSpend = 1000;
  const roi = baselineSpend > 0 ? estimatedRevenue / baselineSpend : 0;
  return {
    clicks: Math.round(clicks),
    estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
    roi: Math.round(roi * 100) / 100,
  };
}
