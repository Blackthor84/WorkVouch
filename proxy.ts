import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only protect authenticated app sections
  const protectedRoutes = [
    "/dashboard",
    "/admin",
    "/employer",
    "/employee",
  ]

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (!isProtected) {
    return NextResponse.next()
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
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
