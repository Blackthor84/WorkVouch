'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface ExportDataButtonProps {
  endpoint: string
  filename?: string
  label?: string
}

export default function ExportDataButton({
  endpoint,
  filename = 'export.csv',
  label = 'Export Data',
}: ExportDataButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(endpoint)
      if (!res.ok) {
        throw new Error('Export failed')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={loading}
      variant="secondary"
      className="flex items-center gap-2"
    >
      <ArrowDownTrayIcon className="h-5 w-5" />
      {loading ? 'Exporting...' : label}
    </Button>
  )
}
