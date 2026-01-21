// proxy.ts — required for Next.js 14+ (replaces middleware.ts)

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export default function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Only protect employer routes
  if (url.pathname.startsWith('/employer/')) {
    // Check if user has employer role from cookie or header
    // Note: In production, you should verify this server-side
    const role = request.cookies.get('role')?.value || request.headers.get('x-user-role') || 'user';
    
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

  return NextResponse.next();
}
