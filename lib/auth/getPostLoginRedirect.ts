import { isImpersonating } from "@/lib/auth/isImpersonating";

/**
 * Post-login redirect — single source of truth from profiles.role.
 * employee → /dashboard/employee
 * employer → /dashboard/employer
 * admin (or superadmin) → /admin (unless impersonating → /dashboard)
 * default → /onboarding
 */
export type PostLoginUser = {
  role?: string;
  profile_complete?: boolean;
};

function normalizeRole(role?: string): string {
  return String(role ?? "").trim().toLowerCase();
}

export async function getPostLoginRedirect(user: PostLoginUser): Promise<string> {
  const role = normalizeRole(user.role);

  if (role === "admin" || role === "superadmin") {
    if (await isImpersonating()) return "/dashboard";
    return "/admin";
  }
  switch (role) {
    case "employer":
      return "/dashboard/employer";
    case "employee":
      return "/dashboard/employee";
    default:
      return "/onboarding";
  }
}
