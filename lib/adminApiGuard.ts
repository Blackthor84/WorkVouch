/**
 * Shared admin auth guard for API routes. Never throws.
 * Returns ok: true or { ok: false, status, error } for 401/403.
 */

export type AdminLike = {
  isAuthenticated?: boolean;
  isAdmin?: boolean;
};

export type GuardResult =
  | { ok: true }
  | { ok: false; status: 401 | 403; error: string };

export function requireAdmin(
  admin: AdminLike | null | undefined
): GuardResult {
  if (admin == null) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  if (!admin.isAuthenticated) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  if (!admin.isAdmin) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true };
}
