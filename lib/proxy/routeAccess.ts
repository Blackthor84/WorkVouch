import type { ResolvedAppRole } from "@/lib/auth/roleTypes";
import { getHomePathForResolvedRole } from "@/lib/auth/roleRouting";

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

function isEmployeeAppPath(pathname: string): boolean {
  const prefixes = [
    "/dashboard",
    "/profile",
    "/settings",
    "/my-jobs",
    "/coworker-matches",
    "/notifications",
    "/upgrade",
    "/onboarding",
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
    "/jobs",
  ];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function isEmployerPortalPath(pathname: string): boolean {
  return pathname === "/employer" || pathname.startsWith("/employer/");
}

/**
 * Returns a pathname to redirect to, or null to continue the request.
 * Caller must not invoke for /api/* or when impersonation bypass is active.
 */
export function getRoleAccessRedirect(
  pathname: string,
  hasUser: boolean,
  resolved: ResolvedAppRole
): string | null {
  if (!hasUser) {
    if (pathRequiresAuth(pathname)) return "/login";
    return null;
  }

  if (pathname === "/login" || pathname === "/signup") {
    return getHomePathForResolvedRole(resolved);
  }

  if (pathname.startsWith("/onboarding") && resolved === "super_admin") {
    return "/admin";
  }

  if (resolved === "pending") {
    if (skipPendingEnforce(pathname)) return null;
    if (pathname === "/choose-role" || pathname.startsWith("/choose-role/")) return null;
    return "/choose-role";
  }

  if (pathname === "/choose-role" || pathname.startsWith("/choose-role/")) {
    const home = getHomePathForResolvedRole(resolved);
    if (pathname === home || pathname.startsWith(`${home}/`)) return null;
    return home;
  }

  if (resolved === "employer") {
    if (isEmployeeAppPath(pathname)) return "/enterprise";
  }

  if (resolved === "employee") {
    if (pathname.startsWith("/enterprise")) return "/dashboard";
    if (isEmployerPortalPath(pathname) && pathname !== "/employer") {
      return "/dashboard";
    }
    if (pathname === "/employer") {
      return "/coworker-matches";
    }
  }

  if (resolved === "super_admin") {
    if (isEmployeeAppPath(pathname) && !pathname.startsWith("/admin")) {
      return "/admin";
    }
  }

  if (pathname.startsWith("/dashboard/employer")) {
    if (resolved === "employee") return "/unauthorized";
  }
  if (pathname.startsWith("/dashboard/employee") || pathname.startsWith("/dashboard/worker")) {
    if (resolved === "employer") return "/unauthorized";
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/superadmin")) {
    if (resolved !== "super_admin") return "/unauthorized";
  }
  if (pathname.startsWith("/sandbox")) {
    if (resolved !== "super_admin") return "/unauthorized";
  }

  return null;
}
