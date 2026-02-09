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
 */
export default async function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  console.log("PROXY CHECK:", pathname);

  // Sandbox bypass: /employer with sandbox=true&sandboxId allows access without auth
  const sandbox = url.searchParams.get("sandbox") === "true";
  const sandboxId = url.searchParams.get("sandboxId")?.trim() ?? "";
  if (sandbox && sandboxId && pathname.startsWith("/employer")) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-sandbox-mode", "true");
    requestHeaders.set("x-sandbox-id", sandboxId);
    return NextResponse.next({ request: { headers: requestHeaders } });
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
    return response;
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    const signIn = new URL("/login", req.url);
    signIn.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signIn);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
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
