import type { EnterpriseContract } from "./contract";

type EntitlementsLike = Record<string, unknown>;

/**
 * Apply enterprise contract overrides to base entitlements.
 * Lets sales say "Yes, we can do that" without touching Stripe.
 */
export function applyEnterpriseContract<T extends EntitlementsLike>(
  entitlements: T,
  contract: EnterpriseContract | null | undefined
): T {
  if (!contract?.overrides) return entitlements;

  return {
    ...entitlements,
    ...contract.overrides,
  };
}
