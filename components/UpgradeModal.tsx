'use client'

import React from 'react'
import Link from 'next/link'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface UpgradeModalProps {
  feature: string
  onClose?: () => void
}

export default function UpgradeModal({ feature, onClose }: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#1F2937] rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-grey-dark dark:text-gray-200">Unlock This Feature</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Upgrade to WorkVouch Professional to access <strong>{feature}</strong>.
        </p>
        <div className="flex gap-4">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-white py-3 px-6 rounded-xl font-semibold transition-colors"
            >
              Maybe Later
            </button>
          )}
          <Link 
            href="/pricing" 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors text-center"
            onClick={onClose}
          >
            Upgrade Now
          </Link>
        </div>
      </div>
    </div>
  )
}
