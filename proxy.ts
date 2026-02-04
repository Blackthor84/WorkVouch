import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 proxy: refresh Supabase session (preserve cookies), then enforce protected routes.
 * Sessions are read from cookies; we do NOT clear auth or log users out on navigation.
 * Only redirect when: no auth token AND route is protected.
 * Public routes (/, /pricing, /passport, /about, /contact, /login, /signup, etc.) pass through.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const response = await updateSession(req);

  const protectedRoutes = [
    "/dashboard",
    "/admin",
    "/employer",
    "/api/employer",
    "/api/admin",
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
  ],
};
