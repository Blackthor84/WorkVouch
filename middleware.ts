import { NextResponse, type NextRequest } from "next/server";

const ANALYTICS_SESSION_COOKIE = "wv_sid";
const ANALYTICS_SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Middleware: NO Supabase auth. Auth is enforced only in Server Components.
 * This file handles only: sandbox API behavior, analytics cookie (headers).
 */
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Fail-soft: all /api/admin/* (except sandbox-v2) return 200 empty in sandbox — no 500s, no blocking
  if (
    path.startsWith("/api/admin") &&
    process.env.ENV === "SANDBOX" &&
    !path.startsWith("/api/admin/sandbox-v2")
  ) {
    return NextResponse.json(
      { data: [], notice: "Not available in sandbox" },
      { status: 200 }
    );
  }

  const res = NextResponse.next({ request: req });

  // Internal analytics: set anonymous session ID for page-view capture (GDPR: no PII in cookie)
  if (!req.cookies.get(ANALYTICS_SESSION_COOKIE)?.value) {
    res.cookies.set(ANALYTICS_SESSION_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: ANALYTICS_SESSION_MAX_AGE,
      path: "/",
    });
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/((?!_next|favicon.ico|api).*)"],
};
