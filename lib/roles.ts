/**
 * Centralized role checks. Use profile.role or session role — do NOT rely on user_metadata.
 * Source of truth: profiles.role and user_roles table (server-side).
 */

export function isAdmin(role?: string | null): boolean {
  return role === "admin" || role === "superadmin";
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === "superadmin";
}
