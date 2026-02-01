"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { searchDirectoryPublic } from "@/lib/actions/directory";
import type { PublicDirectoryItem, PublicDirectoryResult } from "@/lib/actions/directory";

export function DirectoryClient() {
  const [name, setName] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PublicDirectoryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [gatedOpen, setGatedOpen] = useState(false);

  const runSearch = async (p: number) => {
    setLoading(true);
    setData(null);
    try {
      const result = await searchDirectoryPublic({ name, page: p });
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    runSearch(1);
  };

  return (
    <>
      {/* Public: name-only search */}
      <form onSubmit={handleSearch} className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
          <input
            type="search"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Search by name"
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div className="mt-4 flex items-center gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </Button>
          {data?.rateLimitRemaining != null && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {data.rateLimitRemaining} searches left this hour
            </span>
          )}
        </div>
      </form>

      {/* Results: name, industry badge, verified badge, profile strength range only */}
      <div className="mt-8">
        {data?.error && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            {data.error}
          </p>
        )}
        {loading ? (
          <p className="text-slate-500 dark:text-slate-400">Loading…</p>
        ) : data?.items?.length ? (
          <>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              {data.total} result{data.total !== 1 ? "s" : ""} (max 20 per page)
            </p>
            <ul className="space-y-4">
              {data.items.map((item: PublicDirectoryItem) => (
                <li key={item.id}>
                  <Link
                    href={item.url}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                  >
                    {item.profile_photo_url ? (
                      <img src={item.profile_photo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {item.full_name?.charAt(0) || "?"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">{item.full_name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {item.industry && (
                          <span className="inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                            {item.industry.replace(/_/g, " ")}
                          </span>
                        )}
                        {item.verified && (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Profile Strength: {item.profileStrengthRange}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {data.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const next = Math.max(1, page - 1);
                    setPage(next);
                    runSearch(next);
                  }}
                  disabled={page <= 1 || loading}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Page {page} of {data.totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const next = page + 1;
                    setPage(next);
                    runSearch(next);
                  }}
                  disabled={page >= data.totalPages || loading}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : data && !data.error ? (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            No public Career Passports match your search.
          </p>
        ) : null}
      </div>

      {/* CTA for employers */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Need to filter by employer, industry, or location?
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Advanced workforce search is available to verified employer accounts.
        </p>
        <div className="mt-4 flex gap-3">
          <Button asChild>
            <Link href="/auth/signup">Create Employer Account</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/auth/signin">Login</Link>
          </Button>
        </div>
      </div>

      {/* Gated modal: when public tries advanced (we don't expose those inputs; modal can be shown if we add a "More filters" link) */}
      {gatedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setGatedOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Advanced search</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Advanced workforce search is available to verified employer accounts.
            </p>
            <div className="mt-6 flex gap-3">
              <Button asChild>
                <Link href="/auth/signup">Create Employer Account</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/auth/signin">Login</Link>
              </Button>
              <Button variant="ghost" onClick={() => setGatedOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
