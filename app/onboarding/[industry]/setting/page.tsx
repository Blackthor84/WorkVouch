'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Navbar } from '@/components/navbar'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SETTING_OPTIONS, INDUSTRY_DISPLAY_NAMES, type Industry } from '@/lib/constants/industries'

export default function IndustrySettingStep() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const industry = (params?.industry as Industry) || ''
  const [setting, setSetting] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function checkUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        router.push('/auth/signin')
        return
      }

      setUser(currentUser)
    }

    checkUser()
  }, [router, supabase])

  const handleNext = async () => {
    if (!setting) {
      alert('Please select a work setting')
      return
    }

    setLoading(true)

    try {
      const tableName = `${industry}_profiles`
      
      const { error } = await supabase
        .from(tableName)
        .update({ work_setting: setting })
        .eq('user_id', user.id)

      if (error) {
        console.error(`Error saving ${industry} setting:`, error)
        alert('Error saving setting. Please try again.')
        setLoading(false)
        return
      }

      router.push(`/onboarding/${industry}/job`)
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

  const settings = SETTING_OPTIONS[industry] || []
  const industryName = INDUSTRY_DISPLAY_NAMES[industry] || industry

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background dark:bg-[#0D1117]">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
          <Card className="p-8">
            <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200 mb-2">
              Select Your {industryName} Work Setting
            </h1>
            <p className="text-grey-medium dark:text-gray-400 mb-6">
              Where do you usually work?
            </p>

            <div className="mb-6">
              <Label htmlFor="setting" className="mb-2 block">
                Work Setting *
              </Label>
              <select
                id="setting"
                value={setting}
                onChange={(e) => setSetting(e.target.value)}
                className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">-- Select Setting --</option>
                {settings.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleNext}
              disabled={!setting || loading}
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
