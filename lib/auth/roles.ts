/**
 * Single source of truth for admin role checks.
 * Admin access: admin | superadmin | super_admin — use everywhere.
 */

export const ADMIN_ROLE_VALUES = ["admin", "superadmin", "super_admin"] as const;

export function normalizeRole(role?: string | null): string {
  if (!role) return "user";
  if (role === "super_admin") return "superadmin";
  return role;
}

export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return (
    role === "admin" || role === "superadmin" || role === "super_admin"
  );
}

export function isSuperAdminRole(role?: string | null): boolean {
  return normalizeRole(role) === "superadmin";
}
