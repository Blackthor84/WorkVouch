import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  console.log("=== PROXY DEBUG ===")
  console.log("Path:", pathname)
  console.log("Token exists:", !!token)
  console.log("Token:", token)

  const publicRoutes = [
    "/",
    "/about",
    "/pricing",
    "/faq",
    "/contact",
    "/privacy",
    "/terms",
    "/auth/signin",
    "/auth/signup",
    "/api/auth",
  ]

  const isPublic = publicRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (!token && !isPublic) {
    console.log("Redirecting to /auth/signin from proxy")
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/employer/:path*",
    "/employee/:path*",
  ],
}
