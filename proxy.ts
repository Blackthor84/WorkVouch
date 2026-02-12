import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /**
   * ==========================================================
   * ALWAYS ALLOW STATIC + PUBLIC FILES
   * ==========================================================
   * These must NEVER require authentication.
   * This fixes 401 errors for manifest.json and sw.js.
   */

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/manifest") || // Allow manifest.json and query variants
    pathname.startsWith("/sw") || // Allow service worker
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  /**
   * ==========================================================
   * PROTECTED ROUTES
   * ==========================================================
   */

  const protectedRoutes = [
    "/dashboard",
    "/admin",
    "/employer",
    "/profile",
    "/settings",
  ];

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  /**
   * ==========================================================
   * SESSION CHECK (Supabase)
   * ==========================================================
   */

  const hasSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("sb-"));

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
