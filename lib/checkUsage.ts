import { getPlanLimits } from "./planLimits";

export async function checkUsage(
  row: { plan_tier: string; reports_used?: number; searches_used?: number; seats_used?: number },
  type: "reports" | "searches" | "seats"
) {
  const limits = getPlanLimits(row.plan_tier);

  if (!limits) {
    throw new Error("Unknown plan tier");
  }

  const max = limits[type];
  const used = row[`${type}_used`] ?? 0;

  if (max === -1) {
    return { allowed: true };
  }

  if (used < max) {
    return { allowed: true };
  }

  // At or over limit
  if (!limits.allowOverage) {
    return {
      allowed: false,
      error: "Plan limit reached. Upgrade to continue.",
    };
  }

  return { allowed: true, overage: true };
}
