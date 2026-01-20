import { Navbar } from '@/components/navbar'
import { WarehouseOnboardingWrapper } from './warehouse-onboarding-wrapper'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function WarehouseOnboardingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  // Check if user's industry is warehousing
  const { data: profile } = await supabase
    .from('profiles')
    .select('industry')
    .eq('id', user.id)
    .single()

  if (profile?.industry !== 'warehousing') {
    redirect('/dashboard')
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <WarehouseOnboardingWrapper userId={user.id} />
        </div>
      </main>
    </>
  )
}
