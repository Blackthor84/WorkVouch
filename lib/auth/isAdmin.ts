/**
 * Single source of truth for admin role check.
 * Admins are system operators, not platform participants.
 * Use everywhere for redirect, onboarding bypass, and profile requirements.
 */

/** Normalize role for comparison (DB may store "admin" or "ADMIN"). */
function normalizeRoleForCheck(role?: string): string {
  if (role == null || role === "") return "";
  return String(role).trim().toUpperCase();
}

export function isAdmin(user?: { role?: string }): boolean {
  const r = normalizeRoleForCheck(user?.role);
  return r === "ADMIN" || r === "SUPERADMIN";
}
