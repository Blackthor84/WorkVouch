import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { getUserConnections } from '@/lib/actions/connections'
import { NavbarServer } from '@/components/navbar-server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserGroupIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'

export default async function CoworkerMatchesPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  const connections = await getUserConnections()

  return (
    <>
      <NavbarServer />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 bg-background dark:bg-[#0D1117] min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
            Coworker Matches
          </h1>
          <p className="text-grey-medium dark:text-gray-400">
            Find and connect with people you've worked with
          </p>
        </div>

        {connections && connections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connections.map((connection: any) => {
              const otherUser = connection.user1_id === user.id ? connection.user2 : connection.user1
              return (
                <Card key={connection.id} className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    {otherUser?.profile_photo_url ? (
                      <img
                        src={otherUser.profile_photo_url}
                        alt={otherUser.full_name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                          {otherUser?.full_name?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200">
                        {otherUser?.full_name || 'Unknown User'}
                      </h3>
                      <p className="text-sm text-grey-medium dark:text-gray-400">
                        {otherUser?.city && otherUser?.state
                          ? `${otherUser.city}, ${otherUser.state}`
                          : 'Location not specified'}
                      </p>
                    </div>
                  </div>
                  
                  {connection.status === 'connected' && (
                    <Badge variant="success" className="mb-4">
                      <CheckBadgeIcon className="h-4 w-4 mr-1" />
                      Connected
                    </Badge>
                  )}
                  
                  <div className="flex gap-2">
                    <Button variant="secondary" href={`/profile/${otherUser?.id}`} className="flex-1">
                      View Profile
                    </Button>
                    <Button variant="ghost" href={`/messages?user=${otherUser?.id}`}>
                      Message
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <UserGroupIcon className="h-12 w-12 text-grey-medium dark:text-gray-400 mx-auto mb-4" />
            <p className="text-grey-medium dark:text-gray-400 mb-4">
              No coworker matches yet. Add your job history to find people you've worked with.
            </p>
            <Button href="/dashboard#jobs">
              Add Job History
            </Button>
          </Card>
        )}
      </main>
    </>
  )
}
