import { createMiddlewareClient } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes
  const path = request.nextUrl.pathname

  // If no user, only allow public routes
  if (!user) {
    if (path.startsWith('/admin') || path.startsWith('/employer') || 
        path.startsWith('/dashboard') || path.startsWith('/jobs')) {
      return NextResponse.redirect(new URL('/auth/signin?error=Unauthorized', request.url))
    }
    return response
  }

  // Check if user is superadmin - superadmin bypasses all restrictions
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  const userRoles = roles?.map(r => r.role) || []
  const isSuperAdmin = userRoles.includes('superadmin')

  // Superadmin can access everything - no further checks needed
  if (isSuperAdmin) {
    return response
  }

  // Admin routes - check for admin or superadmin
  if (path.startsWith('/admin')) {
    const hasAdminAccess = userRoles.includes('admin') || userRoles.includes('superadmin')
    if (!hasAdminAccess) {
      return NextResponse.redirect(new URL('/dashboard?error=InsufficientPermissions', request.url))
    }
  }

  // Employer routes - check for employer role
  if (path.startsWith('/employer')) {
    const hasEmployerAccess = userRoles.includes('employer') || userRoles.includes('superadmin')
    if (!hasEmployerAccess) {
      return NextResponse.redirect(new URL('/dashboard?error=InsufficientPermissions', request.url))
    }
  }

  // User routes (dashboard, jobs, etc.) - any authenticated user can access
  // No additional checks needed

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/employer/:path*',
    '/dashboard/:path*',
    '/jobs/:path*',
  ],
}
