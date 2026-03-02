"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { getIndustryEmphasis } from "@/lib/industryEmphasis";
import type { EmphasisComponent } from "@/lib/industryEmphasis";
import { EMPLOYER_DISCLAIMER_NOT_ACCEPTED } from "@/lib/employer/requireEmployerLegalAcceptance";
import { EmployerLegalDisclaimerModal } from "@/components/employer/EmployerLegalDisclaimerModal";
import { TrustTrajectoryBadge } from "@/components/trust/TrustTrajectoryBadge";

interface SearchResult {
  id: string;
  name: string | null;
  industry: string | null;
  city: string | null;
  state: string | null;
  verifiedEmploymentCount: number;
  totalEmploymentCount?: number;
  verifiedEmploymentCoveragePct: number;
  trustScore: number;
  referenceCount: number;
  aggregateRating: number;
  rehireEligibleCount: number;
  skills: string[];
  trustTrajectory?: "improving" | "stable" | "at_risk";
  trustTrajectoryLabel?: string;
  trustTrajectoryTooltipFactors?: string[];
}

function TrustSummaryBullets({
  user,
  order,
  expanded,
}: {
  user: SearchResult;
  order: EmphasisComponent[];
  expanded?: boolean;
}) {
  const bullets: { key: EmphasisComponent; label: string; value: string }[] = [
    { key: "employment", label: "Verified employment coverage", value: `${user.verifiedEmploymentCoveragePct ?? 0}%` },
    { key: "rating", label: "Avg rating", value: user.referenceCount > 0 ? `${user.aggregateRating.toFixed(1)}/5` : "—" },
    { key: "referenceVolume", label: "References", value: `${user.referenceCount}` },
  ];
  const byKey = new Map(bullets.map((b) => [b.key, b]));
  const ordered = order
    .map((key) => byKey.get(key))
    .filter((b): b is (typeof bullets)[0] => b != null);

  return (
    <ul className="text-sm text-grey-dark dark:text-gray-200 space-y-0.5 list-disc list-inside">
      {ordered.map((b) => (
        <li key={b.key}>
          {b.label}: {b.value}
        </li>
      ))}
      {expanded && typeof user.totalEmploymentCount === "number" && (
        <li>Verified roles: {user.verifiedEmploymentCount} of {user.totalEmploymentCount}</li>
      )}
    </ul>
  );
}

export function UserSearchForm() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [employerIndustryType, setEmployerIndustryType] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [acceptingDisclaimer, setAcceptingDisclaimer] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedDetailsIds, setExpandedDetailsIds] = useState<Set<string>>(new Set());

  const emphasisOrder = getIndustryEmphasis(employerIndustryType);

  const toggleDetails = (id: string) => {
    setExpandedDetailsIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  const runSearchRequest = useCallback(
    async (query: string) => {
      const response = await fetch(
        `/api/employer/search-users?query=${encodeURIComponent(query)}`,
        { credentials: "include" },
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const data = errorData as { error?: string; code?: string };
        if (response.status === 403 && data.code === EMPLOYER_DISCLAIMER_NOT_ACCEPTED) {
          setPendingQuery(query);
          setShowDisclaimerModal(true);
          return;
        }
        if (response.status === 403) {
          router.push("/dashboard");
          return;
        }
        throw new Error(data.error || "Search failed");
      }
      const data = await response.json();
      setResults(data.users || []);
      setEmployerIndustryType(data.employerIndustryType ?? null);
    },
    [router],
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setError("Please enter at least 2 characters to search");
      return;
    }

    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      await runSearchRequest(searchQuery.trim());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during search",
      );
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
      if (pendingQuery) {
        setIsSearching(true);
        setError(null);
        try {
          await runSearchRequest(pendingQuery);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "An error occurred during search",
          );
          setResults([]);
        } finally {
          setIsSearching(false);
          setPendingQuery(null);
        }
      }
    } finally {
      setAcceptingDisclaimer(false);
    }
  };

  const highlightMatch = (text: string | null, query: string) => {
    if (!text || !query) return text ?? "";
    const terms = query.toLowerCase().split(/\s+/).filter((term) => term.length > 0);
    let highlighted = text;
    terms.forEach((term) => {
      const regex = new RegExp(`(${term})`, "gi");
      highlighted = highlighted.replace(
        regex,
        '<mark class="bg-yellow-200 dark:bg-yellow-900/50">$1</mark>',
      );
    });
    return highlighted;
  };

  return (
    <>
      <Card className="p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-grey-medium dark:text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by first name, last name, or full name..."
              className="w-full pl-10 pr-4 py-3 border border-grey-background dark:border-[#374151] rounded-lg bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              minLength={2}
            />
          </div>
          <Button
            type="submit"
            disabled={isSearching || searchQuery.trim().length < 2}
            size="lg"
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </form>
        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </Card>

      {hasSearched && (
        <Card className="p-6">
          {isSearching ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" />
              <p className="mt-4 text-grey-medium dark:text-gray-400">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-grey-medium dark:text-gray-400">No results found</p>
              <p className="text-sm text-grey-medium dark:text-gray-400 mt-2">
                Try a different search term
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-grey-medium dark:text-gray-400">
                  Found {results.length} {results.length === 1 ? "result" : "results"}
                </p>
                {selectedIds.size >= 2 && selectedIds.size <= 4 && (
                  <Button onClick={goToCompare} size="sm">
                    Compare selected ({selectedIds.size})
                  </Button>
                )}
                {selectedIds.size > 0 && selectedIds.size < 2 && (
                  <p className="text-sm text-grey-medium dark:text-gray-400">
                    Select 2–4 candidates to compare
                  </p>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-grey-background dark:border-[#374151]">
                      <th className="text-left py-3 px-4 font-semibold text-grey-dark dark:text-gray-200 w-12">
                        Compare
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-grey-dark dark:text-gray-200">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-grey-dark dark:text-gray-200">
                        Reputation Score
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-grey-dark dark:text-gray-200">
                        Summary
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-grey-dark dark:text-gray-200">
                        Skills
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-grey-dark dark:text-gray-200">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-grey-background dark:border-[#374151] hover:bg-grey-background dark:hover:bg-[#1A1F2B] transition-colors"
                      >
                        <td className="py-4 px-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(user.id)}
                            onChange={() => toggleSelect(user.id)}
                            disabled={!selectedIds.has(user.id) && selectedIds.size >= 4}
                            className="rounded border-grey-background dark:border-[#374151] text-blue-600 focus:ring-blue-500"
                            aria-label={`Select ${user.name ?? user.id} for comparison`}
                          />
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-grey-dark dark:text-gray-200">
                            <span
                              dangerouslySetInnerHTML={{
                                __html: highlightMatch(user.name ?? "", searchQuery),
                              }}
                            />
                          </div>
                          {(user.city || user.state) && (
                            <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">
                              {[user.city, user.state].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-lg font-bold text-grey-dark dark:text-gray-200">
                            {user.trustScore}
                          </span>
                          <span className="text-xs text-grey-medium dark:text-gray-400 ml-1">
                            / 100
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <TrustTrajectoryBadge
                            trajectory={user.trustTrajectory ?? "stable"}
                            label={user.trustTrajectoryLabel}
                            tooltipFactors={user.trustTrajectoryTooltipFactors}
                            size="sm"
                          />
                        </td>
                        <td className="py-4 px-4">
                          <TrustSummaryBullets user={user} order={emphasisOrder} expanded={expandedDetailsIds.has(user.id)} />
                          <button
                            type="button"
                            onClick={() => toggleDetails(user.id)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                          >
                            {expandedDetailsIds.has(user.id) ? "Hide details" : "Show details"}
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          {user.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.skills.slice(0, 5).map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                                >
                                  {skill}
                                </span>
                              ))}
                              {user.skills.length > 5 && (
                                <span className="px-2 py-1 text-xs text-grey-medium dark:text-gray-400">
                                  +{user.skills.length - 5} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-grey-medium dark:text-gray-400">
                              No skills listed
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <Button href={`/employer/profile/${user.id}`} variant="ghost" size="sm">
                            View Profile
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}

      <EmployerLegalDisclaimerModal
        open={showDisclaimerModal}
        onAccept={handleAcceptDisclaimer}
        accepting={acceptingDisclaimer}
      />
    </>
  );
}
