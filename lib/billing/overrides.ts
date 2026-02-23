import type { EntitlementsShape } from "./entitlements";
import type { PlanKey } from "./plan";

/**
 * Enterprise manual overrides: grant temporary entitlements without changing Stripe.
 * e.g. applyEnterpriseOverride(planEntitlements, { apiAccess: true })
 */
export function applyEnterpriseOverride(
  planEntitlements: EntitlementsShape,
  overrides: Partial<EntitlementsShape>
): EntitlementsShape {
  return {
    ...planEntitlements,
    ...overrides,
  };
}
