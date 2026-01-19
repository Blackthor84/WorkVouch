'use client'

import { Card } from '../ui/card'
import { Button } from '../ui/button'

export function CompanyProfileSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
          Company Profile Settings
        </h2>
        <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">
          Manage your company information and preferences
        </p>
      </div>

      <Card className="p-6">
        <p className="text-grey-medium dark:text-gray-400">
          Company profile settings coming soon. This will allow you to customize your company information, logo, and preferences.
        </p>
      </Card>
    </div>
  )
}
