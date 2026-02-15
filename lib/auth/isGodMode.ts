/**
 * Central God Mode check. Only SUPERADMIN with explicitly enabled God Mode passes.
 * Use in auth guards: if (!isAdmin(user) && !isGodMode(session)) return 403.
 */

function normalizeRole(role?: string): string {
  if (role == null || role === "") return "";
  return String(role).trim().toUpperCase();
}

export type SessionWithGodMode = {
  user?: { role?: string };
  godMode?: { enabled?: boolean };
};

export function isGodMode(session?: SessionWithGodMode | null): boolean {
  if (!session) return false;
  const r = normalizeRole(session.user?.role);
  const isSuperAdmin = r === "SUPERADMIN";
  const enabled = session.godMode?.enabled === true;
  return isSuperAdmin && enabled;
}
