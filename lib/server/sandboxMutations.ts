/**
 * Sandbox mutations gate: ENABLE_SANDBOX_MUTATIONS env flag.
 * Superadmin can always perform sandbox mutations (bypass). When flag is true, admin can too.
 * All other roles locked. RLS stays enabled. No NODE_ENV-based blocking.
 */

export const SANDBOX_BULK_MAX = 1000;

export function isSandboxMutationsEnabled(): boolean {
  return process.env.ENABLE_SANDBOX_MUTATIONS === "true";
}

export function isSuperadmin(role: string | undefined | null): boolean {
  if (role == null) return false;
  const r = String(role).toLowerCase().trim();
  return r === "superadmin" || r === "super_admin";
}

/** True when mutations are allowed: superadmin always, or ENABLE_SANDBOX_MUTATIONS=true for admin. */
export function canPerformSandboxMutations(role: string | undefined | null): boolean {
  return isSuperadmin(role) || isSandboxMutationsEnabled();
}

/**
 * Returns allowed bulk count: superadmin up to SANDBOX_BULK_MAX; when flag on, superadmin up to 1000; otherwise defaultCap.
 */
export function getAllowedBulkCount(role: string | undefined | null, requested: number, defaultCap: number): number {
  if (!isSuperadmin(role) && !isSandboxMutationsEnabled()) return defaultCap;
  if (requested <= 0) return defaultCap;
  if (isSuperadmin(role)) return Math.min(requested, SANDBOX_BULK_MAX);
  return defaultCap;
}
