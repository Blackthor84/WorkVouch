import { isImpersonating } from "@/lib/auth/isImpersonating";
import { resolveUserRole } from "@/lib/auth/resolveUserRole";

/**
 * Post-login redirect — exclusive role destinations (profiles.role only).
 * pending → /choose-role
 * super_admin → /admin (unless impersonating → /dashboard)
 * employer → /enterprise
 * employee → /dashboard
 */
export type PostLoginUser = {
  role?: string | null;
  profile_complete?: boolean;
};

export async function getPostLoginRedirect(user: PostLoginUser): Promise<string> {
  const resolved = resolveUserRole({ role: user.role });

  if (resolved === "pending") {
    return "/choose-role";
  }
  if (resolved === "super_admin") {
    if (await isImpersonating()) return "/dashboard";
    return "/admin";
  }
  if (resolved === "employer") {
    return "/enterprise";
  }
  if (resolved === "employee") {
    return "/dashboard";
  }
  return "/choose-role";
}
