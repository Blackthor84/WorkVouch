/**
 * Single exclusive app role for routing and UI.
 * Allowed DB values: employee | employer | super_admin | NULL (pending role choice).
 * Legacy values (admin, superadmin, user) normalize to employee (except superadmin → super_admin for migration).
 */

import type { ResolvedAppRole } from "@/lib/auth/roleTypes";

export type { ResolvedAppRole } from "@/lib/auth/roleTypes";

/** Pass only `profiles.role` — never auth metadata (avoids bypassing /choose-role). */
type UserLike = { role?: string | null } | null;

/**
 * Resolves one canonical role. NULL/empty role → pending (must complete /choose-role).
 */
export function resolveUserRole(user: UserLike): ResolvedAppRole {
  const r = String(user?.role ?? "").trim().toLowerCase();

  if (!r) {
    return "pending";
  }

  if (r === "super_admin" || r === "superadmin") {
    return "super_admin";
  }

  if (r === "employer") {
    return "employer";
  }

  if (r === "employee") {
    return "employee";
  }

  /* Legacy / invalid → employee (strict product roles only) */
  if (r === "admin" || r === "user" || r === "worker") {
    return "employee";
  }

  return "employee";
}
