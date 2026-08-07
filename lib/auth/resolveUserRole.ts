/**
 * Single exclusive app role for routing and UI.
 * Canonical DB values: employee | employer | admin | NULL (pending).
 * Legacy aliases normalize internally — never written to DB or returned from APIs.
 */

import type { ResolvedAppRole } from "@/lib/auth/roleTypes";

export type { ResolvedAppRole } from "@/lib/auth/roleTypes";

/** Pass only `profiles.role` — never auth metadata (avoids bypassing /choose-role). */
type UserLike = { role?: string | null } | null;

const EMPLOYEE_ALIASES = new Set(["user", "worker", "candidate", "member"]);
const ADMIN_ALIASES = new Set(["super_admin", "superadmin"]);

/**
 * Resolves one canonical role. NULL/empty role → pending (must complete /choose-role).
 */
export function resolveUserRole(user: UserLike): ResolvedAppRole {
  const r = String(user?.role ?? "").trim().toLowerCase();

  if (!r) {
    return "pending";
  }

  if (r === "admin" || ADMIN_ALIASES.has(r)) {
    return "admin";
  }

  if (r === "employer") {
    return "employer";
  }

  if (r === "employee" || EMPLOYEE_ALIASES.has(r)) {
    return "employee";
  }

  return "employee";
}
