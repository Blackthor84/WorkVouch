/**
 * Employer verified-workers list: plan caps and filter rules (FINAL pricing).
 * Free: 3 | Starter: 25 | Pro & Custom: unlimited.
 */

export type EmployerMonetizationTier = "free" | "starter" | "pro" | "custom";

export function normalizeEmployerMonetizationTier(
  planTier: string | null | undefined
): EmployerMonetizationTier {
  const t = (planTier || "free").toLowerCase().replace(/-/g, "_");
  if (t === "pro" || t === "team" || t === "growth" || t === "enterprise") return "pro";
  if (t === "starter" || t === "basic" || t === "lite" || t === "pay_per_use") return "starter";
  if (t === "custom") return "custom";
  return "free";
}

/** Max workers visible with full detail. Infinity = unlimited. */
export function getVerifiedWorkersCap(tier: EmployerMonetizationTier): number {
  if (tier === "free") return 3;
  if (tier === "starter") return 25;
  return Number.POSITIVE_INFINITY;
}

export function canUseLocationFilter(tier: EmployerMonetizationTier): boolean {
  return tier !== "free";
}

export function canUseJobTypeFilter(tier: EmployerMonetizationTier): boolean {
  return tier === "starter" || tier === "pro" || tier === "custom";
}

export function shouldHighlightTrusted(tier: EmployerMonetizationTier): boolean {
  return tier === "pro" || tier === "custom";
}

export function shouldSortByTrust(tier: EmployerMonetizationTier): boolean {
  return tier === "pro" || tier === "custom";
}
