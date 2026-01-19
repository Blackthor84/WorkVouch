import Link from 'next/link'
import { getCurrentUser, getCurrentUserRoles } from '@/lib/auth'
import { SignOutButton } from './sign-out-button'
import { Button } from './ui/button'
import { ThemeToggle } from './theme-toggle'
import { NotificationsBell } from './notifications-bell'
import { DashboardNavButton } from './dashboard-nav-button'
import { Logo } from './logo'

export async function Navbar() {
  const user = await getCurrentUser()
  const roles = await getCurrentUserRoles()

  return (
    <nav className="sticky top-0 z-50 border-b border-grey-background dark:border-[#374151] bg-white dark:bg-[#0D1117] shadow-sm py-2">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 items-center justify-between">
          <div className="flex items-center">
            <Logo size="xl" showText={false} />
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <div className="flex items-center gap-3">
                <DashboardNavButton />
                <NotificationsBell />
                <Button variant="ghost" size="sm" href="/pricing">
                  Pricing
                </Button>
                {(roles?.includes('admin') || roles?.includes('superadmin')) && (
                  <Button variant="ghost" size="sm" href="/admin" className="font-semibold text-primary dark:text-blue-400">
                    Admin
                  </Button>
                )}
                {(roles?.includes('employer') || roles?.includes('superadmin')) && (
                  <Button variant="ghost" size="sm" href="/employer/dashboard" className="font-semibold">
                    Employer Panel
                  </Button>
                )}
                <span className="hidden sm:inline text-sm font-semibold text-grey-dark dark:text-gray-300">{user.email}</span>
                <SignOutButton />
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" href="/pricing">
                  Pricing
                </Button>
                <Button variant="ghost" size="sm" href="/auth/signin">
                  Sign In
                </Button>
                <Button size="sm" href="/auth/signup">
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

