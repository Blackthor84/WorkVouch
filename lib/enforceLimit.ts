import { getPlanLimits } from "./planLimits";

export type EnforceLimitType = "reports" | "searches" | "seats";

export interface EnforceLimitResult {
  allowed: boolean;
  error?: string;
  overage?: boolean;
}

export interface EnforceLimitPreviewOverrides {
  seats_used?: number;
  reports_used?: number;
  searches_used?: number;
  expired?: boolean;
}

export async function enforceLimit(
  row: { plan_tier: string; reports_used?: number; searches_used?: number; seats_used?: number },
  type: "reports" | "searches" | "seats",
  previewOverrides?: EnforceLimitPreviewOverrides | null
): Promise<EnforceLimitResult> {
  if (previewOverrides?.expired === true) {
    return { allowed: false, error: "Subscription expired (preview)." };
  }

  const limits = getPlanLimits(row.plan_tier);

  if (!limits) {
    throw new Error("Unknown plan tier");
  }

  const max = limits[type];
  const used =
    type === "seats"
      ? previewOverrides?.seats_used ?? row.seats_used ?? 0
      : type === "reports"
        ? previewOverrides?.reports_used ?? row.reports_used ?? 0
        : previewOverrides?.searches_used ?? row.searches_used ?? 0;

  if (max === -1) {
    return { allowed: true };
  }

  if (used < max) {
    return { allowed: true };
  }

  if (!limits.allowOverage) {
    return {
      allowed: false,
      error: "Plan limit reached. Upgrade required.",
    };
  }

  return { allowed: true, overage: true };
}
