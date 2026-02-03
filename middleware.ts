import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { updateSession } from "@/lib/supabase/middleware"

/**
 * Root middleware: refresh Supabase session (do not clear), then enforce protected routes.
 * Sessions are read from cookies; we do NOT assume null session = logged out.
 * We do NOT clear auth state or redirect logged-in users to /login.
 * Only redirect when: no auth cookie/token exists AND route is protected.
 * Users remain logged in until explicit logout.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const protectedRoutes = [
    "/dashboard",
    "/admin",
    "/employer",
    "/employee",
  ]
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))

  const response = await updateSession(request)

  if (!isProtected) {
    return response
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    const signIn = new URL("/auth/signin", request.url)
    signIn.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signIn)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
