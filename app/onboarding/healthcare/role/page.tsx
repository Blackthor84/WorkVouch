import { NavbarServer } from '@/components/navbar-server'
import { HealthcareRoleClient } from './healthcare-role-client'

export default function HealthcareRoleStep() {
  return (
    <>
      <NavbarServer />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <HealthcareRoleClient />
        </div>
      </main>
    </>
  )
}
