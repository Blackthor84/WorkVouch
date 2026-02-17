import { isAdmin } from "@/lib/auth/isAdmin";

export type PostLoginUser = {
  role?: string;
  profile_complete?: boolean;
};

/**
 * Central post-login redirect. Admin check must come first.
 * Role-based: worker -> /worker/dashboard, employer -> /employer/dashboard, admin -> /admin.
 * Superadmin lands on /admin?godmode=off (God Mode is opt-in, never automatic).
 */
export function getPostLoginRedirect(user: PostLoginUser): string {
  if (isAdmin(user)) {
    const r = String(user.role ?? "").trim().toUpperCase();
    return r === "SUPERADMIN" ? "/admin?godmode=off" : "/admin";
  }
  if (!user.profile_complete) {
    return "/onboarding";
  }
  const role = String(user.role ?? "").trim().toLowerCase();
  if (role === "employer") {
    return "/employer/dashboard";
  }
  if (role === "worker" || role === "user") {
    return "/worker/dashboard";
  }
  return "/worker/dashboard";
}
