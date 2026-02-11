import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js middleware (invoked via middleware.ts): refresh Supabase session, then enforce protected routes.
 * [PWA] Public paths (manifest, icons, static) are never blocked — prevents 401 on manifest.json.
 * Admin: requires admin or superadmin role; logs IP + timestamp on unauthorized.
 * Employer: requires employer role. Dashboard/employee: requires any authenticated session.
 */

const PUBLIC_PATHS = [
  "/",
  "/about",
  "/pricing",
  "/careers",
  "/contact",
  "/login",
  "/signup",
  "/manifest.json",
  "/favicon.ico",
  "/apple-touch-icon.png",
  "/robots.txt",
  "/sitemap.xml",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.some((p) => p === pathname)) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/icons/")) return true;
  if (pathname.startsWith("/images/")) return true;
  if (pathname.startsWith("/passport/")) return true; // public profile e.g. /passport/username
  return false;
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip")?.trim() ?? "unknown";
}

export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // ---------- PUBLIC: static, PWA, marketing — never block ----------
  if (isPublicPath(pathname)) {
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

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const roles = (token?.roles as string[] | undefined) ?? [];
  const hasAdmin = roles.includes("admin") || roles.includes("superadmin");
  const hasEmployer = roles.includes("employer");

  // ---------- ADMIN (pages + API) ----------
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!token) {
      if (pathname.startsWith("/api/")) {
        const res = NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        addSecurityHeaders(res);
        return res;
      }
      const signIn = new URL("/login", req.url);
      signIn.searchParams.set("callbackUrl", pathname);
      const redirectRes = NextResponse.redirect(signIn);
      addSecurityHeaders(redirectRes);
      return redirectRes;
    }
    if (!hasAdmin) {
      const ip = getClientIp(req);
      const timestamp = new Date().toISOString();
      console.warn("[SECURITY] Unauthorized admin access", { ip, path: pathname, timestamp });
      if (pathname.startsWith("/api/")) {
        const res = NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        addSecurityHeaders(res);
        return res;
      }
      const signIn = new URL("/login", req.url);
      signIn.searchParams.set("callbackUrl", pathname);
      const redirectRes = NextResponse.redirect(signIn);
      addSecurityHeaders(redirectRes);
      return redirectRes;
    }
    addSecurityHeaders(response);
    return response;
  }

  // ---------- EMPLOYER (pages + API) ----------
  if (pathname.startsWith("/employer") || pathname.startsWith("/api/employer")) {
    if (!token) {
      if (pathname.startsWith("/api/")) {
        const res = NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        addSecurityHeaders(res);
        return res;
      }
      const signIn = new URL("/login", req.url);
      signIn.searchParams.set("callbackUrl", pathname);
      const redirectRes = NextResponse.redirect(signIn);
      addSecurityHeaders(redirectRes);
      return redirectRes;
    }
    if (!hasEmployer) {
      if (pathname.startsWith("/api/")) {
        const res = NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        addSecurityHeaders(res);
        return res;
      }
      const signIn = new URL("/login", req.url);
      signIn.searchParams.set("callbackUrl", pathname);
      const redirectRes = NextResponse.redirect(signIn);
      addSecurityHeaders(redirectRes);
      return redirectRes;
    }
    addSecurityHeaders(response);
    return response;
  }

  // ---------- DASHBOARD / EMPLOYEE (any authenticated user) ----------
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/employee") ||
    pathname.startsWith("/api/employee")
  ) {
    if (!token) {
      if (pathname.startsWith("/api/")) {
        const res = NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        addSecurityHeaders(res);
        return res;
      }
      const signIn = new URL("/login", req.url);
      signIn.searchParams.set("callbackUrl", pathname);
      const redirectRes = NextResponse.redirect(signIn);
      addSecurityHeaders(redirectRes);
      return redirectRes;
    }
    addSecurityHeaders(response);
    return response;
  }

  addSecurityHeaders(response);
  return response;
}

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
    "/((?!_next/static|_next/image).*)",
    "/admin",
    "/admin/:path*",
    "/employer",
    "/employer/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/employee",
    "/employee/:path*",
    "/api/admin/:path*",
    "/api/employer/:path*",
    "/api/employee/:path*",
  ],
};
