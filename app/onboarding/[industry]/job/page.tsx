import { NavbarServer } from '@/components/navbar-server'
import { JobFormClient } from './job-form-client'
import { type Industry } from '@/lib/constants/industries'

// Mark as dynamic to prevent build-time prerendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

interface PageProps {
  params: {
    industry: Industry
  }
}

export default function IndustryJobStep({ params }: PageProps) {
  const industry = params.industry

  return (
    <>
      <NavbarServer />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <JobFormClient industry={industry} />
        </div>
      </main>
    </>
  )
}
