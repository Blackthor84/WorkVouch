"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { searchDirectoryEmployer } from "@/lib/actions/directory";
import type { EmployerDirectoryFilters, EmployerDirectoryItem, EmployerDirectoryResult } from "@/lib/actions/directory";

export function EmployerDirectoryClient() {
  const [filters, setFilters] = useState<EmployerDirectoryFilters>({});
  const [page, setPage] = useState(1);
  const [data, setData] = useState<EmployerDirectoryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runSearch = async (p: number) => {
    setLoading(true);
    setData(null);
    try {
      const result = await searchDirectoryEmployer({ filters, page: p, limit: 20 });
      setData(result);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    runSearch(1);
  };

  return (
    <>
      <form onSubmit={handleSearch} className="mt-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <input
              type="search"
              value={filters.name ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
              placeholder="Search by name"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Current Employer</label>
            <input
              type="text"
              value={filters.currentEmployer ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, currentEmployer: e.target.value }))}
              placeholder="Company name"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Past Employer</label>
            <input
              type="text"
              value={filters.pastEmployer ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, pastEmployer: e.target.value }))}
              placeholder="Company name"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Industry</label>
            <input
              type="text"
              value={filters.industry ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, industry: e.target.value }))}
              placeholder="e.g. healthcare"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
            <input
              type="text"
              value={filters.location ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
              placeholder="City or state"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Min Profile Strength</label>
            <input
              type="number"
              min={0}
              max={100}
              value={filters.minProfileStrength ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, minProfileStrength: e.target.value ? parseInt(e.target.value, 10) : undefined }))}
              placeholder="0–100"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={filters.verifiedOnly ?? false}
              onChange={(e) => setFilters((f) => ({ ...f, verifiedOnly: e.target.checked }))}
              className="rounded border-slate-300"
            />
            Verified only
          </label>
          <Button type="submit" disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </Button>
        </div>
      </form>

      {data?.error && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          {data.error}
        </p>
      )}

      {data?.items?.length ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {data.total} result{data.total !== 1 ? "s" : ""}
          </p>
          <ul className="space-y-4">
            {data.items.map((item: EmployerDirectoryItem) => (
              <li key={item.id}>
                <Link
                  href={item.url}
                  className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                >
                  <div className="flex items-start gap-4">
                    {item.profile_photo_url ? (
                      <img src={item.profile_photo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                        {item.full_name?.charAt(0) || "?"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">{item.full_name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {[item.industry?.replace(/_/g, " "), item.city, item.state].filter(Boolean).join(" · ") || "—"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {item.credentialSummary} · Ref rate: {item.referenceResponseRate != null ? `${item.referenceResponseRate}%` : "—"} · {item.integrityStatus}
                      </p>
                      {item.employmentTimelinePreview?.length > 0 && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {item.employmentTimelinePreview.map((e) => `${e.job_title} at ${e.company_name}`).join("; ")}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {item.profileStrength}
                    </span>
                  </div>
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
        </div>
      ) : data && !data.error ? (
        <p className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No results. Try adjusting filters.
        </p>
      ) : null}
    </>
  );
}
