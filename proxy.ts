import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // 🚫 NEVER touch auth or public files
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico" ||
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup")
  ) {
    return NextResponse.next();
  }

  // 🔒 Only protect real private routes
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

  // ✅ Session: next-auth or Supabase cookie (proxy is the only route guard)
  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.includes("next-auth") || c.name.includes("sb-"));

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
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
