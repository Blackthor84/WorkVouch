/**
 * Post-login redirect — single source of truth from profiles.role.
 * employee → /dashboard/employee
 * employer → /dashboard/employer
 * admin (or superadmin) → /admin
 * default → /onboarding
 */
export type PostLoginUser = {
  role?: string;
  profile_complete?: boolean;
};

function normalizeRole(role?: string): string {
  return String(role ?? "").trim().toLowerCase();
}

export function getPostLoginRedirect(user: PostLoginUser): string {
  const role = normalizeRole(user.role);

  switch (role) {
    case "admin":
    case "superadmin":
      return "/admin";
    case "employer":
      return "/dashboard/employer";
    case "employee":
      return "/dashboard/employee";
    default:
      return "/onboarding";
  }
}
