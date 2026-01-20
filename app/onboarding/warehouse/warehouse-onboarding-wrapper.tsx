'use client'

import { useRouter } from 'next/navigation'
import { WarehouseOnboarding } from '@/components/warehouse-onboarding'
import { Card } from '@/components/ui/card'

interface WarehouseOnboardingWrapperProps {
  userId: string
}

export function WarehouseOnboardingWrapper({ userId }: WarehouseOnboardingWrapperProps) {
  const router = useRouter()

  const handleComplete = () => {
    router.push('/dashboard')
  }

  return (
    <Card className="p-8">
      <WarehouseOnboarding userId={userId} onComplete={handleComplete} />
    </Card>
  )
}
