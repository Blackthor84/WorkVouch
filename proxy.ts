// proxy.ts — Next.js 14+ proxy middleware (replaces middleware.ts)
// Handles both API proxy routing and auth-based redirects

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export default async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // ============================================
  // Dashboard Protection with Supabase Auth
  // ============================================
  if (url.pathname.startsWith("/dashboard")) {
    // Check for Supabase session token in cookies
    // Supabase stores session in multiple cookie formats
    const hasSession = 
      request.cookies.get("sb-access-token")?.value ||
      request.cookies.get("sb-refresh-token")?.value ||
      request.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`)?.value;
    
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  
  // ============================================
  // Beta User Access Control
  // ============================================
  try {
    // Create Supabase client for auth checks
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get session from Supabase (if available)
    const token = request.cookies.get("sb-access-token")?.value;
    if (token) {
      const { data: { session } } = await supabase.auth.getSession();

      // Check if user has beta role (from user metadata or profile)
      const isBeta = session?.user?.user_metadata?.role === "beta";

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
    }
  } catch (error) {
    // If token check fails, continue with request (don't block)
    // This allows unauthenticated users to access public pages
    console.error("Auth check error in proxy:", error);
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
