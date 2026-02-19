/**
 * Sandbox access: admin or superadmin. Use for all /api/sandbox/* guards.
 */
export function canAccessSandbox(role?: string | null): boolean {
  if (role == null) return false;
  const r = String(role).toLowerCase().trim();
  return r === "admin" || r === "superadmin" || r === "super_admin";
}
