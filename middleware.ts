import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // Get the session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if user has beta role
  const isBeta = token?.role === "beta" || 
                (Array.isArray(token?.roles) && token?.roles.includes("beta"));

  if (isBeta) {
    // Redirect beta users away from pricing and checkout pages
    if (
      request.nextUrl.pathname.startsWith("/pricing") ||
      request.nextUrl.pathname.startsWith("/api/pricing/checkout") ||
      request.nextUrl.pathname.startsWith("/api/stripe")
    ) {
      return NextResponse.redirect(new URL("/preview-only", request.url));
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
