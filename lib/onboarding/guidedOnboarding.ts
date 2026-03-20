/**
 * Guided 3-step onboarding: job → matches → first review.
 * Completion unlocks the full trust-profile loop in UX copy (metrics already accumulate incrementally).
 */

export const GUIDED_ONBOARDING_SKIPPED_KEY = "workvouch_guided_onboarding_skipped";

export type GuidedOnboardingStats = {
  jobsCount: number;
  matchesCount: number;
  referenceCount: number;
};

export type GuidedStep = 1 | 2 | 3 | "complete";

export function getGuidedStep(stats: GuidedOnboardingStats): GuidedStep {
  if (stats.jobsCount < 1) return 1;
  if (stats.matchesCount < 1) return 2;
  if (stats.referenceCount < 1) return 3;
  return "complete";
}

export function isGuidedProfileComplete(stats: GuidedOnboardingStats): boolean {
  return getGuidedStep(stats) === "complete";
}
