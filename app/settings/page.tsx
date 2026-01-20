import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { NavbarServer } from '@/components/navbar-server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserSettings } from '@/components/settings/user-settings'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <>
      <NavbarServer />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
            Settings
          </h1>
          <p className="mt-1 text-sm text-grey-medium dark:text-gray-400">
            Manage your account and privacy settings
          </p>
        </div>
        <UserSettings />
      </main>
    </>
  )
}
