"use client";

import { useState, useCallback } from "react";
import {
  searchCandidates,
  type CandidateSearchResult,
  type CandidateSearchFilters,
} from "@/lib/actions/employer/candidate-search";
import { EMPLOYER_DISCLAIMER_NOT_ACCEPTED } from "@/lib/employer/requireEmployerLegalAcceptance";
import { EmployerLegalDisclaimerModal } from "@/components/employer/EmployerLegalDisclaimerModal";
import { INDUSTRIES } from "@/lib/constants/industries";
import { Search, Bookmark, BookmarkX, Star } from "lucide-react";
import {
  saveCandidate,
  isCandidateSaved,
} from "@/lib/actions/employer/saved-candidates";
import { WvCard, WvButton, WvInput } from "@/components/wv";

const selectClass =
  "w-full rounded-xl border border-wv-border bg-wv-surface px-4 py-2.5 text-sm text-wv-foreground transition-colors focus:border-wv-brand-blue/50 focus:outline-none focus:ring-2 focus:ring-wv-brand-blue/30";

export function CandidateSearch() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CandidateSearchResult[]>([]);
  const [filters, setFilters] = useState({
    industry: "",
    job_title: "",
    location: "",
    min_trust_score: "",
  });
  const [savedCandidates, setSavedCandidates] = useState<Set<string>>(
    new Set(),
  );
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [acceptingDisclaimer, setAcceptingDisclaimer] = useState(false);
  const [pendingSearchFilters, setPendingSearchFilters] = useState<
    CandidateSearchFilters | null
  >(null);

  const runSearch = useCallback(
    async (searchFilters: CandidateSearchFilters) => {
      const data = await searchCandidates(searchFilters);
      setResults(data);
      const saved = new Set<string>();
      for (const candidate of data) {
        const savedStatus = await isCandidateSaved(candidate.id);
        if (savedStatus) saved.add(candidate.id);
      }
      setSavedCandidates(saved);
    },
    [],
  );

  const handleSearch = async () => {
    const searchFilters: CandidateSearchFilters = {
      industry: filters.industry || undefined,
      job_title: filters.job_title || undefined,
      location: filters.location || undefined,
      min_trust_score: filters.min_trust_score
        ? parseInt(filters.min_trust_score, 10)
        : undefined,
    };
    setLoading(true);
    try {
      await runSearch(searchFilters);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to search candidates";
      if (message === EMPLOYER_DISCLAIMER_NOT_ACCEPTED) {
        setPendingSearchFilters(searchFilters);
        setShowDisclaimerModal(true);
      } else {
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDisclaimer = async () => {
    setAcceptingDisclaimer(true);
    try {
      const res = await fetch("/api/employer/legal-acceptance", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert((data as { error?: string }).error ?? "Failed to accept");
        return;
      }
      setShowDisclaimerModal(false);
      if (pendingSearchFilters) {
        setLoading(true);
        try {
          await runSearch(pendingSearchFilters);
        } finally {
          setLoading(false);
          setPendingSearchFilters(null);
        }
      }
    } finally {
      setAcceptingDisclaimer(false);
    }
  };

  const handleSaveCandidate = async (candidateId: string) => {
    try {
      await saveCandidate(candidateId);
      setSavedCandidates(
        new Set(Array.from(savedCandidates).concat(candidateId)),
      );
    } catch (error: unknown) {
      alert(
        error instanceof Error ? error.message : "Failed to save candidate",
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <WvCard glow>
        <h2 className="text-xl font-semibold text-wv-foreground mb-4">Search Candidates</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="search-industry" className="mb-1.5 block text-sm font-medium text-wv-muted">Industry</label>
            <select
              id="search-industry"
              value={filters.industry}
              onChange={(e) => setFilters({ ...filters, industry: e.target.value })}
              className={selectClass}
            >
              <option value="">All Industries</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>
          <WvInput
            label="Job Title"
            type="text"
            value={filters.job_title}
            onChange={(e) => setFilters({ ...filters, job_title: e.target.value })}
            placeholder="e.g., Security Guard"
          />
          <WvInput
            label="Location"
            type="text"
            value={filters.location}
            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            placeholder="City or State"
          />
          <WvInput
            label="Min Reputation Score"
            type="number"
            value={filters.min_trust_score}
            onChange={(e) => setFilters({ ...filters, min_trust_score: e.target.value })}
            placeholder="0-1000"
            min={0}
            max={1000}
          />
        </div>
        <WvButton onClick={handleSearch} disabled={loading} className="mt-4">
          <Search className="h-4 w-4" aria-hidden />
          {loading ? "Searching..." : "Search Candidates"}
        </WvButton>
      </WvCard>

      {/* Search Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-wv-foreground">
            {results.length} candidate{results.length !== 1 ? "s" : ""} found
          </h3>
          {results.map((candidate) => (
            <WvCard key={candidate.id} hover>
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
                      <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center ring-1 ring-wv-border">
                        <span className="text-blue-300 font-semibold text-lg">
                          {candidate.full_name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="text-xl font-semibold text-wv-foreground">
                        {candidate.full_name}
                      </h4>
                      <p className="text-sm text-wv-muted">
                        {candidate.city && candidate.state
                          ? `${candidate.city}, ${candidate.state}`
                          : "Location not specified"}
                      </p>
                      {candidate.trust_score !== null && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-sm font-semibold text-wv-foreground">Reputation Score:</span>
                          <span className="text-sm font-bold text-blue-400">
                            {candidate.trust_score}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {candidate.jobs.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-wv-foreground mb-1">Recent Jobs:</p>
                      <div className="space-y-1">
                        {candidate.jobs.slice(0, 3).map((job, idx) => (
                          <p
                            key={idx}
                            className="text-sm text-wv-muted"
                          >
                            {job.job_title} at {job.company_name}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {candidate.references.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-wv-foreground mb-1">Reference Snippet:</p>
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < Math.round(candidate.references[0].rating) ? "fill-amber-400 text-amber-400" : "text-wv-border"}`}
                            aria-hidden
                          />
                        ))}
                      </div>
                      {candidate.references[0].written_feedback && (
                        <p className="text-sm text-wv-muted italic">
                          "
                          {candidate.references[0].written_feedback.substring(
                            0,
                            100,
                          )}
                          {candidate.references[0].written_feedback.length > 100
                            ? "..."
                            : ""}
                          "
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <WvButton variant="secondary" href={`/employer/candidates/${candidate.id}`}>
                    View Full Profile
                  </WvButton>
                  <WvButton
                    variant="ghost"
                    onClick={() => handleSaveCandidate(candidate.id)}
                    disabled={savedCandidates.has(candidate.id)}
                  >
                    {savedCandidates.has(candidate.id) ? (
                      <>
                        <BookmarkX className="h-4 w-4" aria-hidden />
                        Saved
                      </>
                    ) : (
                      <>
                        <Bookmark className="h-4 w-4" aria-hidden />
                        Save Candidate
                      </>
                    )}
                  </WvButton>
                </div>
              </div>
            </WvCard>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && (
        <WvCard className="text-center py-12">
          <p className="text-wv-muted">No candidates found. Try adjusting your search filters.</p>
        </WvCard>
      )}

      <EmployerLegalDisclaimerModal
        open={showDisclaimerModal}
        onAccept={handleAcceptDisclaimer}
        accepting={acceptingDisclaimer}
      />
    </div>
  );
}
