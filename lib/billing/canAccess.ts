import { ENTITLEMENTS } from "./entitlements";
import type { PlanKey } from "./plan";
import type { EntitlementsShape } from "./entitlements";

type FeatureKey = keyof EntitlementsShape;

export function canAccess(
  plan: PlanKey,
  feature: FeatureKey
): boolean {
  const value = ENTITLEMENTS[plan]?.[feature];
  if (typeof value === "number") return value === Infinity || value > 0;
  return Boolean(value);
}

/** Session-like shape for demo/impersonation bypass. */
export type BillingSessionLike = {
  demoMode?: boolean;
  impersonation?: { impersonating?: boolean };
} | null | undefined;

/**
 * Use everywhere instead of raw canAccess when you have session context.
 * Demo mode or active impersonation bypasses paywalls (sales/investor demos never see "Upgrade").
 */
export function hasAccess(
  plan: PlanKey,
  feature: FeatureKey,
  session: BillingSessionLike
): boolean {
  if (session?.demoMode || session?.impersonation?.impersonating) {
    return true;
  }
  return canAccess(plan, feature);
}
