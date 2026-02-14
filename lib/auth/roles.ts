/**
 * Single source of truth for role normalization.
 * Use everywhere to avoid super_admin vs superadmin mismatches.
 */

export function normalizeRole(role?: string | null): string {
  if (!role) return "user";
  if (role === "super_admin") return "superadmin";
  return role;
}

export function isAdminRole(role?: string | null): boolean {
  const r = normalizeRole(role);
  return r === "admin" || r === "superadmin";
}

export function isSuperAdminRole(role?: string | null): boolean {
  return normalizeRole(role) === "superadmin";
}
