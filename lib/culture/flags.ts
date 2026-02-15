/**
 * Culture feature flags. Hidden; SQL is unaware these exist.
 * Used by Cursor logic only: matching, soft insights, environment summary.
 */

export const FEATURE_FLAGS = {
  USE_CULTURE_IN_MATCHING: true,
  SHOW_SOFT_INSIGHTS: false,
  SHOW_ENVIRONMENT_SUMMARY: false,
} as const;

export type CultureFeatureFlags = typeof FEATURE_FLAGS;
