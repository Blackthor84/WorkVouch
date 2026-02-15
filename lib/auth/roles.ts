/**
 * Single source of truth for admin role checks.
 * Use normalizeRole() for all comparisons. Canonical: "admin" | "super_admin".
 */

import { normalizeRole as normalizeRoleFn } from "./normalizeRole";

export const ADMIN_ROLE_VALUES = ["admin", "super_admin"] as const;

/** Re-export for backward compatibility. Prefer importing from @/lib/auth/normalizeRole. */
export { normalizeRole } from "./normalizeRole";

export function isAdminRole(role?: string | null): boolean {
  const r = normalizeRoleFn(role);
  return r === "admin" || r === "super_admin";
}

export function isSuperAdminRole(role?: string | null): boolean {
  return normalizeRoleFn(role) === "super_admin";
}

/** Check if user is admin or superadmin (for redirect/onboarding bypass). Use with profile or session.user. */
export function isAdmin(user: { role?: string | null } | undefined): boolean {
  return isAdminRole(user?.role);
}
