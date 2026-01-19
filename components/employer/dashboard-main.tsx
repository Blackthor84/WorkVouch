'use client'

import { useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import {
  MagnifyingGlassIcon,
  BriefcaseIcon,
  BookmarkIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'
import { CandidateSearch } from './candidate-search'
import { JobPostingManager } from './job-posting-manager'
import { SavedCandidates } from './saved-candidates'
import { EmployerMessages } from './employer-messages'
import { EmployerBilling } from './employer-billing'
import { CompanyProfileSettings } from './company-profile-settings'

type DashboardTab = 'search' | 'jobs' | 'saved' | 'messages' | 'billing' | 'settings'

export function EmployerDashboardMain() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('search')

  const tabs = [
    { id: 'search' as DashboardTab, label: 'Candidate Search', icon: MagnifyingGlassIcon },
    { id: 'jobs' as DashboardTab, label: 'Job Postings', icon: BriefcaseIcon },
    { id: 'saved' as DashboardTab, label: 'Saved Candidates', icon: BookmarkIcon },
    { id: 'messages' as DashboardTab, label: 'Messages', icon: ChatBubbleLeftRightIcon },
    { id: 'billing' as DashboardTab, label: 'Billing', icon: CreditCardIcon },
    { id: 'settings' as DashboardTab, label: 'Company Profile', icon: BuildingOfficeIcon },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-grey-dark dark:text-gray-200">
          Employer Dashboard
        </h1>
        <p className="mt-1 text-sm text-grey-medium dark:text-gray-400">
          Manage candidates, job postings, and your subscription
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-grey-background dark:border-[#374151]">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-semibold transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-grey-medium dark:text-gray-400 hover:border-grey-light dark:hover:border-[#374151] hover:text-grey-dark dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'search' && <CandidateSearch />}
        {activeTab === 'jobs' && <JobPostingManager />}
        {activeTab === 'saved' && <SavedCandidates />}
        {activeTab === 'messages' && <EmployerMessages />}
        {activeTab === 'billing' && <EmployerBilling />}
        {activeTab === 'settings' && <CompanyProfileSettings />}
      </div>
    </div>
  )
}
