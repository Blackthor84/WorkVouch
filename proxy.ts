import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✅ ALWAYS allow static files and public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/public") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // ✅ Only protect specific private areas
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

  // ✅ Check Supabase session cookie
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
