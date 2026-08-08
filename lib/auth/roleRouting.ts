import type { ResolvedAppRole } from "@/lib/auth/roleTypes";

/**
 * Sync role-zone redirects for route guards (cross-role path blocking).
 * Post-authentication entry routing MUST use getPostLoginRedirect() instead.
 */
export function getRoleZoneRedirect(
  pathname: string,
  resolved: ResolvedAppRole | "unknown"
): string | null {
  if (resolved === "unknown") return null;

  if (pathname === "/employer") {
    if (resolved === "employer") return "/employer/dashboard";
    if (resolved === "employee") return "/coworker-matches";
  }

  if (resolved === "employer") {
    if (pathname.startsWith("/onboarding/employer")) {
      return "/employer/onboarding/start";
    }
    if (pathname === "/employer/search" || pathname.startsWith("/employer/search/")) {
      return "/employer/search-users";
    }
    if (isEmployeeAppPath(pathname)) return "/employer/dashboard";
  }

  if (resolved === "employee") {
    if (pathname.startsWith("/enterprise")) return "/dashboard";
    if (isEmployerPortalPath(pathname) && pathname !== "/employer") {
      return "/dashboard";
    }
  }

  if (resolved === "admin") {
    if (isEmployeeAppPath(pathname) && !pathname.startsWith("/admin")) {
      return "/admin";
    }
  }

  if (resolved === "pending") {
    if (pathname.startsWith("/onboarding/employer")) {
      return "/employer/onboarding/start";
    }
  }

  if (pathname.startsWith("/dashboard/employer")) {
    if (resolved === "employer") return "/employer/dashboard";
    if (resolved === "employee") return "/unauthorized";
  }
  if (pathname.startsWith("/dashboard/employee") || pathname.startsWith("/dashboard/worker")) {
    if (resolved === "employer") return "/unauthorized";
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/superadmin")) {
    if (resolved !== "admin") return "/unauthorized";
  }
  if (pathname.startsWith("/sandbox")) {
    if (resolved !== "admin") return "/unauthorized";
  }

  return null;
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
