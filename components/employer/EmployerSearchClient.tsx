"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  WvCard,
  WvButton,
  WvEmptyState,
  WvErrorState,
  WvLoadingState,
} from "@/components/wv";
import { EmployerSearchFilters } from "@/components/employer/EmployerSearchFilters";
import { CandidateCard } from "@/components/employer/CandidateCard";
import { EmployerLegalDisclaimerModal } from "@/components/employer/EmployerLegalDisclaimerModal";
import { EMPLOYER_DISCLAIMER_NOT_ACCEPTED } from "@/lib/employer/requireEmployerLegalAcceptance";
import { isCandidateSaved } from "@/lib/actions/employer/saved-candidates";
import type { EmployerSearchFilters as Filters, EmployerSearchResult } from "@/lib/search/employerSearchTypes";
import {
  RECENT_SEARCHES_KEY,
  MAX_RECENT_SEARCHES,
} from "@/lib/search/employerSearchTypes";
import { toCandidateCardData } from "@/lib/search/employerSearchService";

function buildSearchParams(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.query?.trim()) params.set("query", filters.query.trim());
  if (filters.industry) params.set("industry", filters.industry);
  if (filters.jobTitle) params.set("jobTitle", filters.jobTitle);
  if (filters.company) params.set("company", filters.company);
  if (filters.location) params.set("location", filters.location);
  if (filters.minTrustScore != null) params.set("minTrustScore", String(filters.minTrustScore));
  if (filters.maxTrustScore != null) params.set("maxTrustScore", String(filters.maxTrustScore));
  return params.toString();
}

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(label: string) {
  if (typeof window === "undefined" || !label.trim()) return;
  const prev = loadRecentSearches().filter((s) => s !== label);
  const next = [label, ...prev].slice(0, MAX_RECENT_SEARCHES);
  sessionStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
}

export function EmployerSearchClient() {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>({});
  const [results, setResults] = useState<EmployerSearchResult[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [acceptingDisclaimer, setAcceptingDisclaimer] = useState(false);
  const [pendingParams, setPendingParams] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [limitedPreview, setLimitedPreview] = useState(false);

  useEffect(() => {
    setRecentSearches(loadRecentSearches());
  }, []);

  const refreshSaved = useCallback(async (rows: EmployerSearchResult[]) => {
    const saved = new Set<string>();
    await Promise.all(
      rows.map(async (r) => {
        if (await isCandidateSaved(r.id)) saved.add(r.id);
      }),
    );
    setSavedIds(saved);
  }, []);

  const runSearchRequest = useCallback(
    async (params: string) => {
      const response = await fetch(`/api/employer/search-users?${params}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const data = errorData as { error?: string; code?: string };
        if (response.status === 403 && data.code === EMPLOYER_DISCLAIMER_NOT_ACCEPTED) {
          setPendingParams(params);
          setShowDisclaimerModal(true);
          return;
        }
        if (response.status === 403) {
          setError(data.error || "Search is not available on your plan.");
          setResults([]);
          return;
        }
        throw new Error(data.error || "Search failed");
      }
      const data = await response.json();
      const users = (data.users ?? []) as EmployerSearchResult[];
      setResults(users);
      setLimitedPreview(Boolean(data.entitlements?.limitedPreview));
      await refreshSaved(users);
    },
    [router, refreshSaved],
  );

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = buildSearchParams(filters);
    if (!params) {
      setError("Enter a name or at least one filter.");
      return;
    }

    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    const label =
      filters.query?.trim() ||
      [filters.industry, filters.jobTitle, filters.company, filters.location]
        .filter(Boolean)
        .join(" · ") ||
      "Search";

    try {
      await runSearchRequest(params);
      saveRecentSearch(label);
      setRecentSearches(loadRecentSearches());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed. Try again.");
      setResults([]);
    } finally {
      setIsSearching(false);
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
        setError((data as { error?: string }).error ?? "Failed to accept");
        return;
      }
      setShowDisclaimerModal(false);
      if (pendingParams) {
        setIsSearching(true);
        try {
          await runSearchRequest(pendingParams);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Search failed");
          setResults([]);
        } finally {
          setIsSearching(false);
          setPendingParams(null);
        }
      }
    } finally {
      setAcceptingDisclaimer(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  };

  const goToCompare = () => {
    const ids = Array.from(selectedIds);
    if (ids.length >= 2 && ids.length <= 4) {
      router.push(`/employer/compare?ids=${ids.join(",")}`);
    }
  };

  return (
    <>
      <WvCard glow className="mb-6 space-y-4">
        <p className="text-sm text-wv-muted">
          Enter a name or filter by role, company, or trust score. Open a profile to view work history and vouches.
        </p>
        <EmployerSearchFilters filters={filters} onChange={setFilters} />
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
          <WvButton type="submit" disabled={isSearching} size="lg" ariaLabel="Search candidates">
            <Search className="h-5 w-5" aria-hidden />
            {isSearching ? "Searching…" : "Search"}
          </WvButton>
          {recentSearches.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-wv-muted">
              <span>Recent:</span>
              {recentSearches.map((label) => (
                <button
                  key={label}
                  type="button"
                  className="rounded-lg border border-wv-border px-2 py-1 transition-colors hover:bg-wv-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wv-brand-blue/40"
                  onClick={() => {
                    setFilters({ query: label });
                    void handleSearch();
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </form>
        {error && <WvErrorState message={error} className="py-6" />}
        {limitedPreview && (
          <p className="text-xs text-amber-300/90">
            Free preview — upgrade for full trust scores.{" "}
            <a href="/employer/upgrade" className="underline hover:text-amber-200">
              View plans
            </a>
          </p>
        )}
      </WvCard>

      {!hasSearched && !error && (
        <WvEmptyState
          title="Search to begin"
          description="Enter a name, role, or company. Results include trust scores and verified work history."
        />
      )}

      {hasSearched && (
        <div className="space-y-4">
          {isSearching ? (
            <WvCard padding="lg">
              <WvLoadingState label="Searching…" />
            </WvCard>
          ) : results.length === 0 ? (
            <WvEmptyState
              title="No matches"
              description="Broaden your search or remove filters. Try searching by company name."
              action={
                <WvButton variant="outline" size="sm" onClick={() => setFilters({})}>
                  Clear filters
                </WvButton>
              }
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-wv-muted">
                  {results.length} {results.length === 1 ? "result" : "results"} · Select up to 4 to compare.
                </p>
                {selectedIds.size >= 2 && selectedIds.size <= 4 && (
                  <WvButton onClick={goToCompare} size="sm">
                    Compare selected ({selectedIds.size})
                  </WvButton>
                )}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {results.map((user) => (
                  <div key={user.id} className="relative">
                    <label className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-lg bg-wv-surface/90 px-2 py-1 text-xs text-wv-muted">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user.id)}
                        onChange={() => toggleSelect(user.id)}
                        disabled={!selectedIds.has(user.id) && selectedIds.size >= 4}
                        className="rounded border-wv-border"
                        aria-label={`Select ${user.full_name ?? "candidate"} for comparison`}
                      />
                      Compare
                    </label>
                    <CandidateCard
                      candidate={toCandidateCardData(user)}
                      isSaved={savedIds.has(user.id)}
                      onSavedChange={() => void refreshSaved(results)}
                      blurTrust={limitedPreview}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <EmployerLegalDisclaimerModal
        open={showDisclaimerModal}
        onAccept={handleAcceptDisclaimer}
        accepting={acceptingDisclaimer}
      />
    </>
  );
}
