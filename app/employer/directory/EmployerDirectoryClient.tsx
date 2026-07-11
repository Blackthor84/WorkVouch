"use client";

import { useState } from "react";
import Link from "next/link";
import { WvCard, WvButton, WvInput } from "@/components/wv";
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
      <WvCard>
        <form onSubmit={handleSearch}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <WvInput
              label="Name"
              type="search"
              value={filters.name ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
              placeholder="Search by name"
            />
            <WvInput
              label="Current Employer"
              type="text"
              value={filters.currentEmployer ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, currentEmployer: e.target.value }))}
              placeholder="Company name"
            />
            <WvInput
              label="Past Employer"
              type="text"
              value={filters.pastEmployer ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, pastEmployer: e.target.value }))}
              placeholder="Company name"
            />
            <WvInput
              label="Industry"
              type="text"
              value={filters.industry ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, industry: e.target.value }))}
              placeholder="e.g. healthcare"
            />
            <WvInput
              label="Location"
              type="text"
              value={filters.location ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
              placeholder="State"
            />
            <WvInput
              label="Min Profile Strength"
              type="number"
              min={0}
              max={100}
              value={filters.minProfileStrength ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  minProfileStrength: e.target.value ? parseInt(e.target.value, 10) : undefined,
                }))
              }
              placeholder="0–100"
            />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-wv-muted">
              <input
                type="checkbox"
                checked={filters.verifiedOnly ?? false}
                onChange={(e) => setFilters((f) => ({ ...f, verifiedOnly: e.target.checked }))}
                className="rounded border-wv-border bg-wv-surface"
              />
              Verified only
            </label>
            <WvButton type="submit" disabled={loading}>
              {loading ? "Searching…" : "Search"}
            </WvButton>
          </div>
        </form>
      </WvCard>

      {data?.error && (
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          {data.error}
        </p>
      )}

      {data?.items?.length ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-wv-muted">
            {data.total} result{data.total !== 1 ? "s" : ""}
          </p>
          <ul className="space-y-4">
            {data.items.map((item: EmployerDirectoryItem) => (
              <li key={item.id}>
                <Link href={item.url}>
                  <WvCard hover className="block">
                    <div className="flex items-start gap-4">
                      {item.profile_photo_url ? (
                        <img src={item.profile_photo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-wv-surface text-lg font-semibold text-wv-muted">
                          {item.full_name?.charAt(0) || "?"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-wv-foreground">{item.full_name}</p>
                        <p className="text-sm text-wv-muted">
                          {[item.industry?.replace(/_/g, " "), item.state].filter(Boolean).join(" · ") || "—"}
                        </p>
                        <p className="mt-1 text-xs text-wv-muted">
                          {item.credentialSummary} · Ref rate:{" "}
                          {item.referenceResponseRate != null ? `${item.referenceResponseRate}%` : "—"} ·{" "}
                          {item.integrityStatus}
                        </p>
                        {item.employmentTimelinePreview?.length > 0 && (
                          <p className="mt-1 text-xs text-wv-muted">
                            {item.employmentTimelinePreview
                              .map((e) => `${e.title} at ${e.company_name}`)
                              .join("; ")}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-wv-foreground">{item.profileStrength}</span>
                    </div>
                  </WvCard>
                </Link>
              </li>
            ))}
          </ul>
          {data.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <WvButton
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
              </WvButton>
              <span className="text-sm text-wv-muted">
                Page {page} of {data.totalPages}
              </span>
              <WvButton
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
              </WvButton>
            </div>
          )}
        </div>
      ) : data && !data.error ? (
        <WvCard className="mt-6 text-center">
          <p className="text-sm text-wv-muted">No results. Try adjusting filters.</p>
        </WvCard>
      ) : null}
    </>
  );
}
