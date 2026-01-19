import { getCurrentUser } from '@/lib/auth'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { SignOutButton } from '../sign-out-button'
import { BellIcon } from '@heroicons/react/24/outline'

export async function EmployerHeader() {
  const user = await getCurrentUser()

  return (
    <header className="bg-white dark:bg-[#111827] border-b border-grey-background dark:border-[#374151] px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-grey-dark dark:text-gray-200">
            {user?.email || 'Company Name'}
          </h1>
          <Badge variant="success">Pro Plan</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            <BellIcon className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" href="/employer/billing">
            Upgrade
          </Button>
          <SignOutButton />
        </div>
      </div>
    </header>
  )
}
