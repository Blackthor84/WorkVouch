import { Navbar } from '@/components/navbar'
import { JobFormClient } from './job-form-client'
import { type Industry } from '@/lib/constants/industries'

interface PageProps {
  params: {
    industry: Industry
  }
}

export default function IndustryJobStep({ params }: PageProps) {
  const industry = params.industry

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <JobFormClient industry={industry} />
        </div>
      </main>
    </>
  )
}
