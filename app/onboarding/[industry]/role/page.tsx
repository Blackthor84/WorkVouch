import { Navbar } from '@/components/navbar'
import { RoleFormClient } from './role-form-client'
import { type Industry } from '@/lib/constants/industries'

interface PageProps {
  params: {
    industry: Industry
  }
}

export default function IndustryRoleStep({ params }: PageProps) {
  const industry = params.industry

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <RoleFormClient industry={industry} />
        </div>
      </main>
    </>
  )
}
