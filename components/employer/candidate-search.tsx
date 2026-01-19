'use client'

import { useState, useEffect } from 'react'
import { searchCandidates, getCandidateProfileForEmployer, type CandidateSearchResult } from '@/lib/actions/employer/candidate-search'
import { saveCandidate, isCandidateSaved } from '@/lib/actions/employer/saved-candidates'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { MagnifyingGlassIcon, StarIcon, BookmarkIcon, BookmarkSlashIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import Link from 'next/link'

export function CandidateSearch() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CandidateSearchResult[]>([])
  const [filters, setFilters] = useState({
    industry: '',
    job_title: '',
    location: '',
    min_trust_score: '',
  })
  const [savedCandidates, setSavedCandidates] = useState<Set<string>>(new Set())

  const handleSearch = async () => {
    setLoading(true)
    try {
      const searchFilters = {
        industry: filters.industry || undefined,
        job_title: filters.job_title || undefined,
        location: filters.location || undefined,
        min_trust_score: filters.min_trust_score ? parseInt(filters.min_trust_score) : undefined,
      }
      const data = await searchCandidates(searchFilters)
      setResults(data)
      
      // Check which candidates are saved
      const saved = new Set<string>()
      for (const candidate of data) {
        const savedStatus = await isCandidateSaved(candidate.id)
        if (savedStatus) saved.add(candidate.id)
      }
      setSavedCandidates(saved)
    } catch (error: any) {
      alert(error.message || 'Failed to search candidates')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCandidate = async (candidateId: string) => {
    try {
      await saveCandidate(candidateId)
      setSavedCandidates(new Set([...savedCandidates, candidateId]))
    } catch (error: any) {
      alert(error.message || 'Failed to save candidate')
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Search Candidates
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
              Industry
            </label>
            <select
              value={filters.industry}
              onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
              className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-2"
            >
              <option value="">All Industries</option>
              <option value="law_enforcement">Law Enforcement</option>
              <option value="security">Security</option>
              <option value="hospitality">Hospitality</option>
              <option value="retail">Retail</option>
              <option value="warehousing">Warehousing & Logistics</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
              Job Title
            </label>
            <input
              type="text"
              value={filters.job_title}
              onChange={(e) => setFilters({ ...filters, job_title: e.target.value })}
              placeholder="e.g., Security Guard"
              className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
              Location
            </label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              placeholder="City or State"
              className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-grey-dark dark:text-gray-200 mb-2">
              Min Trust Score
            </label>
            <input
              type="number"
              value={filters.min_trust_score}
              onChange={(e) => setFilters({ ...filters, min_trust_score: e.target.value })}
              placeholder="0-1000"
              min="0"
              max="1000"
              className="w-full rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-2"
            />
          </div>
        </div>
        <Button
          onClick={handleSearch}
          disabled={loading}
          className="mt-4"
        >
          <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
          {loading ? 'Searching...' : 'Search Candidates'}
        </Button>
      </Card>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-grey-dark dark:text-gray-200">
            {results.length} candidate{results.length !== 1 ? 's' : ''} found
          </h3>
          {results.map((candidate) => (
            <Card key={candidate.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    {candidate.profile_photo_url ? (
                      <img
                        src={candidate.profile_photo_url}
                        alt={candidate.full_name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                          {candidate.full_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
                        {candidate.full_name}
                      </h4>
                      <p className="text-sm text-grey-medium dark:text-gray-400">
                        {candidate.city && candidate.state
                          ? `${candidate.city}, ${candidate.state}`
                          : candidate.location || 'Location not specified'}
                      </p>
                      {candidate.trust_score !== null && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-sm font-semibold text-grey-dark dark:text-gray-200">
                            Trust Score:
                          </span>
                          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {candidate.trust_score}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {candidate.jobs.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-grey-dark dark:text-gray-200 mb-1">
                        Recent Jobs:
                      </p>
                      <div className="space-y-1">
                        {candidate.jobs.slice(0, 3).map((job, idx) => (
                          <p key={idx} className="text-sm text-grey-medium dark:text-gray-400">
                            {job.job_title} at {job.company_name}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {candidate.references.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-grey-dark dark:text-gray-200 mb-1">
                        Reference Snippet:
                      </p>
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <StarIconSolid
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(candidate.references[0].rating)
                                ? 'text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      {candidate.references[0].written_feedback && (
                        <p className="text-sm text-grey-medium dark:text-gray-400 italic">
                          "{candidate.references[0].written_feedback.substring(0, 100)}
                          {candidate.references[0].written_feedback.length > 100 ? '...' : ''}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    variant="secondary"
                    href={`/employer/candidates/${candidate.id}`}
                  >
                    View Full Profile
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleSaveCandidate(candidate.id)}
                    disabled={savedCandidates.has(candidate.id)}
                  >
                    {savedCandidates.has(candidate.id) ? (
                      <>
                        <BookmarkSlashIcon className="h-5 w-5 mr-2" />
                        Saved
                      </>
                    ) : (
                      <>
                        <BookmarkIcon className="h-5 w-5 mr-2" />
                        Save Candidate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <p className="text-grey-medium dark:text-gray-400">
            No candidates found. Try adjusting your search filters.
          </p>
        </Card>
      )}
    </div>
  )
}
