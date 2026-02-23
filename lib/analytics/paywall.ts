import type { PlanKey } from "@/lib/billing/plan";
import type { EntitlementsShape } from "@/lib/billing/entitlements";

type FeatureKey = keyof EntitlementsShape;

/**
 * Call whenever a paywall lock is shown. Use for analytics: "What feature actually sells upgrades?"
 */
export function trackPaywallHit(feature: FeatureKey, plan: PlanKey): void {
  if (typeof console !== "undefined" && console.log) {
    console.log("PAYWALL_HIT", { feature, plan });
  }
}
