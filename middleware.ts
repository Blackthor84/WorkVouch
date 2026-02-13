import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SENSITIVE_PARAMS = ["access_token", "refresh_token", "type"];

/** Paths that must never be blocked by auth or plan enforcement. */
const AUTH_ALWAYS_ALLOWED = [
  "/auth",
  "/auth/callback",
  "/api/auth",
  "/login",
  "/signup",
];

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/employer", "/profile", "/settings", "/enterprise"];

function hasSessionCookie(request: NextRequest): boolean {
  const cookies = request.cookies.getAll();
  return cookies.some(
    (c) => c.name.includes("next-auth") || c.name.includes("sb-")
  );
}

/**
 * Strip access_token, refresh_token, type=magiclink from URL and redirect to clean URL.
 * Only allow magic-link redirect target to /auth/callback; reject arbitrary redirect param.
 */
function stripSensitiveParams(request: NextRequest): NextResponse | null {
  const url = request.nextUrl.clone();
  const params = url.searchParams;
  let changed = false;

  for (const key of SENSITIVE_PARAMS) {
    if (params.has(key)) {
      params.delete(key);
      changed = true;
    }
  }

  if (params.has("redirect") || params.has("redirect_to")) {
    params.delete("redirect");
    params.delete("redirect_to");
    changed = true;
  }

  if (!changed) return null;

  const pathname = url.pathname;
  const origin = request.nextUrl.origin;
  const isAuthCallback = pathname === "/auth/callback" || pathname.startsWith("/auth/callback");
  const newPath = isAuthCallback ? "/auth/callback" : pathname;
  const query = params.toString() ? `?${params.toString()}` : "";
  return NextResponse.redirect(`${origin}${newPath}${query}`);
}

export function middleware(request: NextRequest) {
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;

  const allowed =
    pathname === "/" ||
    AUTH_ALWAYS_ALLOWED.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    ) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/favicon.ico";

  if (allowed) {
    const stripped = stripSensitiveParams(request);
    if (stripped) return stripped;
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !hasSessionCookie(request)) {
    return NextResponse.redirect(
      new URL("/login?reason=session_expired", request.url)
    );
  }

  const stripped = stripSensitiveParams(request);
  if (stripped) return stripped;

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|icons|manifest.json|sw.js).*)",
  ],
};
