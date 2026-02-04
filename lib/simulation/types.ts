/**
 * WorkVouch Simulation Engine – type definitions.
 * No Supabase, NextAuth, Stripe. Pure logic only.
 */

export type PlanTier = "free" | "starter" | "pro" | "custom";

export interface SimulationInputs {
  plan: PlanTier;
  seats: number;
  reportsUsed: number;
  searchesUsed: number;
  subscriptionActive: boolean;
  advertiserImpressions?: number;
  advertiserCTR?: number;
}

export interface SimulationOutput {
  allowedReports: number;
  allowedSearches: number;
  seatsAllowed: number;
  overLimit: boolean;
  subscriptionExpired: boolean;
  rehireProbability: number;
  teamCompatibilityScore: number;
  workforceRiskScore: number;
  estimatedRevenue?: number;
  estimatedAdROI?: number;
  estimatedClicks?: number;
}
