import { redirect } from 'next/navigation'
import { getCurrentUser, hasRole, getCurrentUserRoles } from '@/lib/auth'
import { EmployerHeader } from '@/components/employer/employer-header'
import { EmployerSidebar } from '@/components/employer/employer-sidebar'
import { EmployerDashboardClient } from '@/components/employer/EmployerDashboardClient'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Mark as dynamic
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function EmployerDashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }

  const isEmployer = await hasRole('employer')
  const isSuperAdmin = await hasRole('superadmin')
  
  // Allow superadmin to access employer dashboard
  if (!isEmployer && !isSuperAdmin) {
    redirect('/dashboard')
  }

  // Get employer plan tier and account ID
  const supabase = await createSupabaseServerClient()
  const supabaseAny = supabase as any
  type EmployerAccountRow = { id: string; plan_tier: string }
  const { data: employerAccount } = await supabaseAny
    .from('employer_accounts')
    .select('id, plan_tier')
    .eq('user_id', user.id)
    .single()

  const planTier = (employerAccount as EmployerAccountRow | null)?.plan_tier || 'free'
  const employerId = (employerAccount as EmployerAccountRow | null)?.id
  const roles = await getCurrentUserRoles()
  const userRole = roles.includes('employer') ? 'employer' : 'user'

  return (
    <div className="flex min-h-screen bg-background dark:bg-[#0D1117]">
      <EmployerSidebar />
      <div className="flex-1 flex flex-col">
        <EmployerHeader />
        <main className="flex-1 flex flex-col px-6 py-8 md:py-12 lg:py-16">
          <div className="w-full flex flex-col space-y-12 md:space-y-16 lg:space-y-20">
            <EmployerDashboardClient 
              userRole={userRole} 
              planTier={planTier}
              employerId={employerId}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
