/**
 * Role-scoped feature flags for admin analytics. Evaluated server-side only.
 * Disabled features return 404 (not hidden UI). No PII in flag evaluation.
 */

export type AnalyticsFeatureFlags = {
  analyticsV2: boolean;
  financeMetrics: boolean;
  investorExport: boolean;
};

/**
 * Resolve analytics feature flags. Prefer env; default all true for backward compatibility.
 */
export function getAnalyticsFeatureFlags(): AnalyticsFeatureFlags {
  return {
    analyticsV2: process.env.ANALYTICS_V2 !== "false",
    financeMetrics: process.env.FINANCE_METRICS !== "false",
    investorExport: process.env.INVESTOR_EXPORT !== "false",
  };
}

/** Views that require a specific flag. If flag off, API returns 404 for that view. */
const VIEW_FLAG: Partial<Record<string, keyof AnalyticsFeatureFlags>> = {
  finance: "financeMetrics",
};

/**
 * Returns true if the requested view is allowed by feature flags.
 */
export function isViewAllowedByFlags(view: string, flags: AnalyticsFeatureFlags): boolean {
  if (!flags.analyticsV2) return false;
  const required = VIEW_FLAG[view];
  if (!required) return true;
  return Boolean(flags[required]);
}
