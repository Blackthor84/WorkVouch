'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROLE_OPTIONS, LOGISTICS_ROLES, INDUSTRY_DISPLAY_NAMES, type Industry } from '@/lib/constants/industries'

export default function IndustryRoleStep() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const industry = (params?.industry as Industry) || ''
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function checkUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        router.push('/auth/signin')
        return
      }

      // Check if user's industry matches
      const { data: profile } = await supabase
        .from('profiles')
        .select('industry')
        .eq('id', currentUser.id)
        .single()

      if (profile?.industry !== industry) {
        router.push('/dashboard')
        return
      }

      setUser(currentUser)
    }

    checkUser()
  }, [router, supabase, industry])

  const handleNext = async () => {
    if (!role) {
      alert('Please select a role')
      return
    }

    setLoading(true)

    try {
      const tableName = `${industry}_profiles`
      
      // Create or update industry profile
      const { error } = await supabase
        .from(tableName)
        .upsert({
          user_id: user.id,
          role,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error(`Error saving ${industry} role:`, error)
        alert('Error saving role. Please try again.')
        setLoading(false)
        return
      }

      router.push(`/onboarding/${industry}/setting`)
    } catch (err: any) {
      console.error('Error:', err)
      alert('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!user) {
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

  // Get roles for the industry, with special handling for warehousing/logistics
  let roles: string[] = []
  if (industry === 'warehousing') {
    // Combine warehouse and logistics roles
    roles = [...(ROLE_OPTIONS[industry] || []), ...LOGISTICS_ROLES]
  } else {
    roles = ROLE_OPTIONS[industry] || []
  }
  const industryName = INDUSTRY_DISPLAY_NAMES[industry] || industry

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <Card className="p-8">
            <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
              Select Your {industryName} Role
            </h1>
            <p className="text-grey-medium dark:text-gray-400 mb-6">
              Choose the role that best describes your position
            </p>

            <div className="space-y-2 mb-6">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`w-full border-2 rounded-xl py-3 px-4 text-left transition-all ${
                    role === r
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 dark:border-[#374151] bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 hover:border-blue-500'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <Button
              onClick={handleNext}
              disabled={!role || loading}
              className="w-full"
            >
              {loading ? 'Saving...' : 'Next'}
            </Button>
          </Card>
        </div>
      </main>
    </>
  )
}
