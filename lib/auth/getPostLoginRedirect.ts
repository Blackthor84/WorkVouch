import { isImpersonating } from "@/lib/auth/isImpersonating";
import { getEmployerHomePath, getEnterpriseHomePath } from "@/lib/auth/employerRouting";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";

/**
 * Single source of truth for post-authentication routing.
 * Used by login, signup, OAuth callback, email verification, proxy, and role selection.
 */
export type PostLoginUser = {
  id?: string;
  role?: string | null;
  profile_complete?: boolean;
};

export async function getPostLoginRedirect(user: PostLoginUser): Promise<string> {
  const resolved = resolveUserRole({ role: user.role });

  if (resolved === "pending") {
    return "/choose-role";
  }

  if (resolved === "admin") {
    if (await isImpersonating()) return "/dashboard";
    return "/admin";
  }

  if (resolved === "employer") {
    if (user.id) {
      return getEmployerHomePath(user.id);
    }
    return "/employer/onboarding/start";
  }

  if (resolved === "employee") {
    if (user.id) {
      const enterprisePath = await getEnterpriseHomePath(user.id);
      if (enterprisePath) {
        return enterprisePath;
      }
    }
    return "/dashboard";
  }

  return "/choose-role";
}
