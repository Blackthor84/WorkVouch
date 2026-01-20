'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ROLE_OPTIONS, LOGISTICS_ROLES, INDUSTRY_DISPLAY_NAMES, type Industry } from '@/lib/constants/industries'

interface RoleFormClientProps {
  industry: Industry
}

export function RoleFormClient({ industry }: RoleFormClientProps) {
  const router = useRouter()
  const supabase = createClient()
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
      const supabaseAny = supabase as any
      const { data: profile } = await supabaseAny
        .from('profiles')
        .select('industry')
        .eq('id', currentUser.id)
        .single()

      type ProfileRow = { industry: string | null }
      const profileTyped = profile as ProfileRow | null

      if (profileTyped?.industry !== industry) {
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
      const supabaseAny = supabase as any
      
      const { error } = await supabaseAny
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
      <div className="text-center">
        <p className="text-grey-medium dark:text-gray-400">Loading...</p>
      </div>
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
    <Card className="p-8">
      <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
        What's Your {industryName} Role?
      </h1>
      <p className="text-grey-medium dark:text-gray-400 mb-6">
        Select the role that best describes your position
      </p>

      <div className="space-y-3 mb-6">
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              role === r
                ? 'border-primary bg-primary/10 text-primary font-semibold'
                : 'border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 hover:border-primary/50'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <Button
        onClick={handleNext}
        disabled={loading || !role}
        className="w-full"
      >
        {loading ? 'Saving...' : 'Next'}
      </Button>
    </Card>
  )
}
