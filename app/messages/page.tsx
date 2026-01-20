import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { NavbarServer } from '@/components/navbar-server'
import { UserMessages } from '@/components/messages/user-messages'

export default async function MessagesPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <>
      <NavbarServer />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
            Messages
          </h1>
          <p className="text-grey-medium dark:text-gray-400 mt-1">
            Your conversations and notifications
          </p>
        </div>
        <UserMessages />
      </main>
    </>
  )
}
