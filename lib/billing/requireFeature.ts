import { canAccess } from "./canAccess";
import type { PlanKey } from "./plan";
import type { EntitlementsShape } from "./entitlements";

type FeatureKey = keyof EntitlementsShape;

/**
 * Call at the start of API routes that require a paid feature.
 * Throws if plan does not include the feature.
 */
export function requireFeature(plan: PlanKey, feature: FeatureKey): void {
  if (!canAccess(plan, feature)) {
    throw new Error("Upgrade required");
  }
}
