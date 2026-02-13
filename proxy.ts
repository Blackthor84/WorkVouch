import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/auth/callback",
  "/api/auth",
  "/_next",
  "/favicon.ico",
];

export function proxy(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const hasSession = request.cookies
    .getAll()
    .some((c) => c.name.includes("next-auth") || c.name.includes("sb-"));

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
