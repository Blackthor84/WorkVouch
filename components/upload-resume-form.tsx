'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface ParsedJob {
  title: string
  company: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
  location?: string
  responsibilities?: string
}

interface ParsedEducation {
  school: string
  degree?: string
  fieldOfStudy?: string
  startYear?: number
  endYear?: number
  isCurrent?: boolean
  gpa?: number
  description?: string
}

interface ParsedResume {
  jobs: ParsedJob[]
  education: ParsedEducation[]
  skills: string[]
  certifications: string[]
  contactInfo: {
    email?: string
    phone?: string
  }
  summary?: string
}

export function UploadResumeForm() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedResume | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<{ type: 'job' | 'education'; index: number } | null>(null)

  const handleFileSelect = (selectedFile: File) => {
    setError(null)
    setParsedData(null)
    setUploadProgress(0)

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a PDF or DOCX file.')
      return
    }

    // Validate file size (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.')
      return
    }

    setFile(selectedFile)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('resume', file)

      const response = await fetch('/api/resume-upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload and parse resume.')
      }

      const data = await response.json()
      setParsedData(data.parsedData)
      setUploadProgress(100)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during upload.')
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!parsedData) {
      setError('No parsed data to save.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/save-parsed-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save parsed data to profile.')
      }

      alert('Profile updated successfully!')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during saving.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* File Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors border-grey-background dark:border-[#374151] hover:border-blue-400"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={(e) => {
            const selectedFile = e.target.files?.[0]
            if (selectedFile) handleFileSelect(selectedFile)
          }}
        />
        <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-grey-medium dark:text-gray-400 mb-3" />
        <p className="text-grey-dark dark:text-gray-200 font-semibold">
          Drag 'n' drop your resume here, or click to select file
        </p>
        <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">
          PDF or DOCX up to 5MB
        </p>
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-4"
          variant="ghost"
        >
          Select File
        </Button>
      </div>

      {file && (
        <div className="flex items-center justify-between bg-grey-background dark:bg-[#1A1F2B] p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <DocumentArrowUpIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <span className="text-grey-dark dark:text-gray-200">{file.name}</span>
          </div>
          <Button
            onClick={handleUpload}
            disabled={isUploading || isSaving}
            className="ml-auto"
          >
            {isUploading ? 'Parsing...' : 'Upload & Parse'}
          </Button>
        </div>
      )}

      {/* Progress Bar */}
      {isUploading && (
        <div className="w-full bg-grey-background dark:bg-[#1A1F2B] rounded-full h-2.5 mt-4">
          <div
            className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {/* Parsed Data Preview */}
      {parsedData && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
            Parsed Data Preview
          </h2>
          <div className="bg-grey-background dark:bg-[#1A1F2B] p-4 rounded-lg space-y-3">
            {parsedData.jobs.length > 0 && (
              <div>
                <p className="font-semibold text-grey-dark dark:text-gray-200 mb-1">Work History:</p>
                <ul className="list-disc list-inside text-grey-medium dark:text-gray-400 ml-4 space-y-1">
                  {parsedData.jobs.map((job, idx) => (
                    <li key={idx}>
                      {job.title} at {job.company} ({job.startDate} - {job.endDate || 'Present'})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {parsedData.education.length > 0 && (
              <div>
                <p className="font-semibold text-grey-dark dark:text-gray-200 mb-1">Education:</p>
                <ul className="list-disc list-inside text-grey-medium dark:text-gray-400 ml-4 space-y-1">
                  {parsedData.education.map((edu, idx) => (
                    <li key={idx}>
                      {edu.degree} in {edu.fieldOfStudy} from {edu.school} ({edu.endYear})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {parsedData.skills.length > 0 && (
              <div>
                <p className="font-semibold text-grey-dark dark:text-gray-200 mb-1">Skills:</p>
                <div className="flex flex-wrap gap-2">
                  {parsedData.skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? 'Saving...' : 'Confirm & Save to Profile'}
          </Button>
        </div>
      )}
    </div>
  )
}
