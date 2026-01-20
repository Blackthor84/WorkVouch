import { Navbar } from '@/components/navbar'
import { HealthcareSettingClient } from './healthcare-setting-client'

export default function HealthcareSettingStep() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <HealthcareSettingClient />
        </div>
      </main>
    </>
  )
}
