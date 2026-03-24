import type { ResolvedAppRole } from "@/lib/auth/roleTypes";

/**
 * Home URL for a resolved app role (profiles.role–derived).
 * Used after /choose-role and to block returning there when a role exists.
 */
export function getHomePathForResolvedRole(resolved: ResolvedAppRole): string {
  if (resolved === "pending") return "/choose-role";
  if (resolved === "super_admin") return "/admin";
  if (resolved === "employer") return "/enterprise";
  return "/dashboard";
}
