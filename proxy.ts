import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect protected routes
  const protectedPaths = [
    "/dashboard",
    "/admin",
    "/employer",
    "/profile",
    "/settings",
  ];

  const isProtected = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes("sb-"));

  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/employer/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
