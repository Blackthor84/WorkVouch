/**
 * Role-based feature flags. Stored in code; no DB.
 * hasFeature(role, feature) gates UI and backend. All flag changes logged via audit.
 */

import type { AdminRoleType } from "@/lib/permissions";
import { AdminRole } from "@/lib/permissions";

export const AdminFeature = {
  IMPERSONATION: "IMPERSONATION",
  SANDBOX_MODE: "SANDBOX_MODE",
  EXPORT_AUDIT: "EXPORT_AUDIT",
  FEATURE_FLAGS_UI: "FEATURE_FLAGS_UI",
  ANALYTICS_DASHBOARD: "ANALYTICS_DASHBOARD",
  SOC2_REPORTS: "SOC2_REPORTS",
  HIGH_RISK_ACTIONS: "HIGH_RISK_ACTIONS",
} as const;

export type AdminFeatureType = (typeof AdminFeature)[keyof typeof AdminFeature];

const PLATFORM_ADMIN_FEATURES: AdminFeatureType[] = [
  AdminFeature.IMPERSONATION,
  AdminFeature.SANDBOX_MODE,
  AdminFeature.EXPORT_AUDIT,
  AdminFeature.FEATURE_FLAGS_UI,
  AdminFeature.ANALYTICS_DASHBOARD,
  AdminFeature.SOC2_REPORTS,
  AdminFeature.HIGH_RISK_ACTIONS,
];

const PLATFORM_READ_ONLY_FEATURES: AdminFeatureType[] = [
  AdminFeature.EXPORT_AUDIT,
  AdminFeature.ANALYTICS_DASHBOARD,
  AdminFeature.SOC2_REPORTS,
];

const EMPLOYER_ADMIN_FEATURES: AdminFeatureType[] = [
  AdminFeature.ANALYTICS_DASHBOARD,
];

const ROLE_FEATURES: Partial<Record<AdminRoleType, AdminFeatureType[]>> = {
  [AdminRole.PLATFORM_ADMIN]: PLATFORM_ADMIN_FEATURES,
  [AdminRole.PLATFORM_READ_ONLY]: PLATFORM_READ_ONLY_FEATURES,
  [AdminRole.EMPLOYER_ADMIN]: EMPLOYER_ADMIN_FEATURES,
};

/**
 * Returns true if the role has access to the feature. Never throws.
 */
export function hasFeature(
  role: AdminRoleType | null | undefined,
  feature: AdminFeatureType
): boolean {
  if (!role) return false;
  const list = ROLE_FEATURES[role];
  return Array.isArray(list) && list.includes(feature);
}
