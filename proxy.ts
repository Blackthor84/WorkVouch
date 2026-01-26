// proxy.ts — Next.js 14+ proxy middleware (replaces middleware.ts)
// Handles both API proxy routing and auth-based redirects

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // ============================================
  // Beta User Access Control (from middleware.ts)
  // ============================================
  try {
    // Get the session token for beta user checks
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
        url.pathname.startsWith("/pricing") ||
        url.pathname.startsWith("/api/pricing/checkout") ||
        url.pathname.startsWith("/api/stripe")
      ) {
        return NextResponse.redirect(new URL("/preview-only", request.url));
      }
    }
  } catch (error) {
    // If token check fails, continue with request (don't block)
    // This allows unauthenticated users to access public pages
    console.error("Token check error in proxy:", error);
  }

  // ============================================
  // Employer Route Protection (existing logic)
  // ============================================
  if (url.pathname.startsWith('/employer/')) {
    // Check if user has employer role from cookie or header
    // Note: In production, you should verify this server-side
    const role = request.cookies.get('role')?.value || 
                 request.headers.get('x-user-role') || 
                 'user';
    
    // Basic plan restrictions
    if (role === 'employer_basic' || role === 'free') {
      // Protect premium features
      const protectedPaths = [
        '/employer/protected',
        '/employer/analytics',
        '/employer/bulk-verify',
      ];
      
      if (protectedPaths.some(path => url.pathname.startsWith(path))) {
        url.pathname = '/pricing';
        return NextResponse.redirect(url);
      }
    }
  }

  // Continue with the request
  return NextResponse.next();
}

// Configure which routes to run proxy middleware on
// This matches the pattern from middleware.ts but works with proxy.ts
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - handled separately
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
