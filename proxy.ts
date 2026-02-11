import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 proxy: refresh Supabase session (preserve cookies), then enforce protected routes.
 * Sandbox bypass: /employer with ?sandbox=true&sandboxId=* passes through with headers (no auth redirect).
 * Sessions are read from cookies; we do NOT clear auth or log users out on navigation.
 * Only redirect when: no auth token AND route is protected.
 * /admin: any authenticated user can reach /admin; role (admin/superadmin) is enforced in admin layout.
 * Public routes (/, /pricing, /passport, /about, /contact, /login, /signup, etc.) pass through.
 * [PWA] Do not intercept: manifest.json, favicon.ico, robots.txt, sitemap.xml, /images/*, /icons/*, /_next/*
 */
export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // [MIDDLEWARE] [PWA] Skip public assets and static files — ensure manifest.json returns 200
  if (
    pathname === "/manifest.json" ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/icons")
  ) {
    const res = NextResponse.next();
    addSecurityHeaders(res);
    return res;
  }

  // Sandbox bypass: /employer with sandbox=true&sandboxId allows access without auth
  const sandbox = url.searchParams.get("sandbox") === "true";
  const sandboxId = url.searchParams.get("sandboxId")?.trim() ?? "";
  if (sandbox && sandboxId && pathname.startsWith("/employer")) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-sandbox-mode", "true");
    requestHeaders.set("x-sandbox-id", sandboxId);
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    addSecurityHeaders(res);
    return res;
  }

  const response = await updateSession(req);

  const protectedRoutes = [
    "/dashboard",
    "/admin",
    "/employer",
    "/employee",
    "/api/employer",
    "/api/admin",
    "/api/employee",
  ];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isProtected) {
    addSecurityHeaders(response);
    return response;
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const signIn = new URL("/login", req.url);
    signIn.searchParams.set("callbackUrl", pathname);
    const redirectRes = NextResponse.redirect(signIn);
    addSecurityHeaders(redirectRes);
    return redirectRes;
  }

  addSecurityHeaders(response);
  return response;
}

/** Security headers. Do not break Supabase or Stripe (CSP allows their domains). */
function addSecurityHeaders(res: NextResponse): void {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://*.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.stripe.com",
    "frame-src 'self' https://*.stripe.com https://js.stripe.com",
  ].join("; ");
  res.headers.set("Content-Security-Policy", csp);
}

export const config = {
  matcher: [
    "/((?!_next|manifest\\.json|favicon\\.ico|robots\\.txt|sitemap\\.xml|images|icons).*)",
    "/admin",
    "/admin/:path*",
    "/employer",
    "/employer/:path*",
    "/employee",
    "/employee/:path*",
    "/api/admin/:path*",
    "/api/employer/:path*",
    "/api/employee/:path*",
  ],
};
