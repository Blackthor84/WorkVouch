/**
 * Sync role check: throw Forbidden if user is not admin or superadmin.
 * Use when you already have the role string (e.g. from session).
 * For full session + role resolution use lib/admin/requireAdmin.
 */
export function requireAdmin(userRole: string): void {
  if (userRole !== "admin" && userRole !== "superadmin") {
    throw new Error("Forbidden");
  }
}
