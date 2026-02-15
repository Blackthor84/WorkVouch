/**
 * Client-side guard: only call admin APIs when role is admin or superadmin.
 * Use before any fetch to /api/admin/* to avoid 403 spam.
 */
export function shouldCallAdminApi(role: string | null | undefined): boolean {
  if (role == null) return false;
  const r = role.toLowerCase();
  return r === "admin" || r === "superadmin" || r === "super_admin";
}
