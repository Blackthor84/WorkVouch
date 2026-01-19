'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { HomeIcon } from '@heroicons/react/24/outline'
import { HomeIcon as HomeIconSolid } from '@heroicons/react/24/solid'
import { Button } from './ui/button'

export function DashboardNavButton() {
  const router = useRouter()
  const pathname = usePathname()
  const isDashboard = pathname?.startsWith('/dashboard')

  return (
    <Button
      variant="ghost"
      size="sm"
      href="/dashboard/simple"
      className={`flex items-center gap-2 ${
        isDashboard
          ? 'text-blue-600 dark:text-blue-400 font-semibold'
          : 'text-grey-dark dark:text-gray-300'
      }`}
    >
      {isDashboard ? (
        <HomeIconSolid className="h-5 w-5" />
      ) : (
        <HomeIcon className="h-5 w-5" />
      )}
      <span className="hidden sm:inline">Dashboard</span>
    </Button>
  )
}
