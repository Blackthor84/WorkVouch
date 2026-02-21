/**
 * Sandbox mutations gate: ENABLE_SANDBOX_MUTATIONS env flag.
 * When true, superadmin can perform sandbox mutations and bulk generation (up to 1000).
 * All other roles remain locked. RLS stays enabled.
 */

import { getAuthedUser } from "@/lib/auth/getAuthedUser";

export const SANDBOX_BULK_MAX = 1000;

export function isSandboxMutationsEnabled(): boolean {
  return process.env.ENABLE_SANDBOX_MUTATIONS === "true";
}

export function isSuperadmin(role: string | undefined | null): boolean {
  if (role == null) return false;
  const r = String(role).toLowerCase().trim();
  return r === "superadmin" || r === "super_admin";
}

/**
 * Returns allowed bulk count: when ENABLE_SANDBOX_MUTATIONS=true and role=superadmin, up to SANDBOX_BULK_MAX; otherwise defaultCap.
 */
export function getAllowedBulkCount(role: string | undefined | null, requested: number, defaultCap: number): number {
  if (!isSandboxMutationsEnabled() || !isSuperadmin(role)) return defaultCap;
  if (requested <= 0) return defaultCap;
  return Math.min(requested, SANDBOX_BULK_MAX);
}
