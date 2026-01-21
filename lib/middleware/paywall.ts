import { NextRequest, NextResponse } from 'next/server'

/**
 * Check if user has Pro/Enterprise access
 * Redirects to upgrade page if access is denied
 */
export function checkProAccess(req: NextRequest, feature: string): NextResponse | null {
  const role = req.cookies.get('user_role')?.value || req.headers.get('x-user-role') || ''

  // Basic plan users need to upgrade
  if (!role || role === 'employer_basic' || role === 'free') {
    const upgradeUrl = new URL('/pricing', req.url)
    upgradeUrl.searchParams.set('feature', feature)
    upgradeUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(upgradeUrl)
  }

  // Pro and Enterprise have access
  return null
}

/**
 * Check if user has Enterprise access
 */
export function checkEnterpriseAccess(req: NextRequest, feature: string): NextResponse | null {
  const role = req.cookies.get('user_role')?.value || req.headers.get('x-user-role') || ''

  if (role !== 'employer_enterprise' && role !== 'enterprise') {
    const upgradeUrl = new URL('/pricing', req.url)
    upgradeUrl.searchParams.set('feature', feature)
    upgradeUrl.searchParams.set('plan', 'enterprise')
    upgradeUrl.searchParams.set('redirect', req.nextUrl.pathname)
    return NextResponse.redirect(upgradeUrl)
  }

  return null
}
