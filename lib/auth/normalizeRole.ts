/**
 * Single source of truth for admin role normalization.
 * Use everywhere instead of direct string comparisons.
 */

export function normalizeRole(role?: string | null): string {
  if (role == null || role === "") return "";
  const r = String(role).trim().toLowerCase();
  if (r === "superadmin" || r === "super_admin") return "super_admin";
  if (r === "admin") return "admin";
  return role;
}
