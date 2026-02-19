/**
 * Single check for admin-level access. Superadmin is a superset of admin.
 * Use in requireAdminForApi, admin page guards, and admin UI conditionals.
 */
export function isAdminRole(role?: string | null): boolean {
  if (role == null) return false;
  const r = String(role).toLowerCase().trim();
  return r === "admin" || r === "superadmin" || r === "super_admin";
}
