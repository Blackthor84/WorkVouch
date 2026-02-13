import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.includes("next-auth") || c.name.includes("sb-"));

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    if (hasSession) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (
    pathname === "/auth/callback" ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/signup") ||
    pathname === "/manifest.json" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname === "/sw.js" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

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

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login?reason=session_expired", request.url));
  }

  const env =
    request.nextUrl.searchParams.get("sandbox") === "true" ||
    request.nextUrl.searchParams.get("environment") === "sandbox"
      ? "sandbox"
      : request.cookies.get("app_environment")?.value === "sandbox"
        ? "sandbox"
        : "production";

  const nextRes = NextResponse.next();
  nextRes.headers.set("x-app-environment", env);
  nextRes.headers.set("x-sandbox-mode", env === "sandbox" ? "true" : "false");
  nextRes.cookies.set("app_environment", env, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 7 });
  return nextRes;
}

// 🎯 CRITICAL: Only match protected routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/employer/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/enterprise/:path*",
  ],
};
