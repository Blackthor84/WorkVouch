'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { WarehouseOnboarding } from '@/components/warehouse-onboarding'
import { Card } from '@/components/ui/card'

export default function WarehouseOnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        router.push('/auth/signin')
        return
      }

      // Check if user's industry is warehousing
      const { data: profile } = await supabase
        .from('profiles')
        .select('industry')
        .eq('id', currentUser.id)
        .single()

      if (profile?.industry !== 'warehousing') {
        // User is not in warehousing industry, redirect to dashboard
        router.push('/dashboard')
        return
      }

      setUser(currentUser)
      setLoading(false)
    }

    checkUser()
  }, [router, supabase])

  const handleComplete = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background dark:bg-[#0D1117] flex items-center justify-center">
          <div className="text-center">
            <p className="text-grey-medium dark:text-gray-400">Loading...</p>
          </div>
        </main>
      </>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <Card className="p-8">
            <WarehouseOnboarding userId={user.id} onComplete={handleComplete} />
          </Card>
        </div>
      </main>
    </>
  )
}
