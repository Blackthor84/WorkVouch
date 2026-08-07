import type { ResolvedAppRole } from "@/lib/auth/roleTypes";
import { getRoleZoneRedirect } from "@/lib/auth/roleRouting";

/** Profile row missing or unreadable — do not treat as `pending` (avoids /choose-role loops). */
export type RoleForAccess = ResolvedAppRole | "unknown";

/** Paths that require a Supabase session (profiles.role enforced separately). */
const AUTH_PREFIXES = [
  "/choose-role",
  "/dashboard",
  "/profile",
  "/settings",
  "/my-jobs",
  "/verifications",
  "/onboarding",
  "/coworker-matches",
  "/notifications",
  "/upgrade",
  "/jobs",
  "/references",
  "/upload-resume",
  "/candidate",
  "/employee",
  "/requests",
  "/messages",
  "/verify",
  "/fix-profile",
  "/subscribe",
  "/project",
  "/employer",
  "/enterprise",
  "/admin",
  "/superadmin",
  "/sandbox",
  "/worker",
  "/directory/employers",
  "/graph",
  "/verification-request",
] as const;

export function pathRequiresAuth(pathname: string): boolean {
  for (const p of AUTH_PREFIXES) {
    if (pathname === p || pathname.startsWith(`${p}/`)) return true;
  }
  return false;
}

function skipPendingEnforce(pathname: string): boolean {
  return (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

/**
 * Returns a pathname to redirect to, or null to continue the request.
 * Post-auth entry redirects (/login, /signup, /choose-role with role) are handled
 * in proxy.ts via getPostLoginRedirect().
 */
export function getRoleAccessRedirect(
  pathname: string,
  hasUser: boolean,
  resolved: RoleForAccess
): string | null {
  if (!hasUser) {
    if (pathRequiresAuth(pathname)) return "/login";
    return null;
  }

  if (pathname === "/select-role" || pathname.startsWith("/select-role/")) {
    return "/choose-role";
  }

  if (pathname.startsWith("/onboarding") && resolved === "admin") {
    return "/admin";
  }

  if (resolved === "pending") {
    if (skipPendingEnforce(pathname)) return null;
    if (pathname === "/choose-role" || pathname.startsWith("/choose-role/")) return null;
    return "/choose-role";
  }

  return getRoleZoneRedirect(pathname, resolved);
}
