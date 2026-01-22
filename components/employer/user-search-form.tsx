"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface SearchResult {
  id: string;
  name: string;
  email: string;
  skills: string[];
  workHistory: Array<{
    title: string;
    company: string;
    date: string;
  }>;
  summary: string | null;
}

export function UserSearchForm() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

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
      const response = await fetch(
        `/api/employer/search-users?query=${encodeURIComponent(searchQuery.trim())}`,
      );

      if (!response.ok) {
        if (response.status === 403) {
          router.push("/dashboard");
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }

      const data = await response.json();
      setResults(data.users || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during search",
      );
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 0);
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
      {/* Search Form */}
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

      {/* Results */}
      {hasSearched && (
        <Card className="p-6">
          {isSearching ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <p className="mt-4 text-grey-medium dark:text-gray-400">
                Searching...
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-grey-medium dark:text-gray-400">
                No results found
              </p>
              <p className="text-sm text-grey-medium dark:text-gray-400 mt-2">
                Try a different search term
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-grey-medium dark:text-gray-400">
                  Found {results.length}{" "}
                  {results.length === 1 ? "result" : "results"}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-grey-background dark:border-[#374151]">
                      <th className="text-left py-3 px-4 font-semibold text-grey-dark dark:text-gray-200">
                        Name
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-grey-dark dark:text-gray-200">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-grey-dark dark:text-gray-200">
                        Skills
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-grey-dark dark:text-gray-200">
                        Work History
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
                          <div className="font-semibold text-grey-dark dark:text-gray-200">
                            <span
                              dangerouslySetInnerHTML={{
                                __html: highlightMatch(user.name, searchQuery),
                              }}
                            />
                          </div>
                          {user.summary && (
                            <p className="text-sm text-grey-medium dark:text-gray-400 mt-1 line-clamp-2">
                              {user.summary}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-grey-dark dark:text-gray-200">
                            {user.email}
                          </span>
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
                          {user.workHistory.length > 0 ? (
                            <div className="space-y-1">
                              {user.workHistory.map((job, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium text-grey-dark dark:text-gray-200">
                                    {job.title}
                                  </span>
                                  {" at "}
                                  <span className="text-grey-medium dark:text-gray-400">
                                    {job.company}
                                  </span>
                                  {job.date && (
                                    <span className="text-grey-medium dark:text-gray-400 ml-2">
                                      ({job.date})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-grey-medium dark:text-gray-400">
                              No work history
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            href={`/employer/profile/${user.id}`}
                            variant="ghost"
                            size="sm"
                          >
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
    </>
  );
}
