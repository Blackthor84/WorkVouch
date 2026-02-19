"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabaseSession } from "@/lib/hooks/useSupabaseSession";

type Overview = {
  totalUsers: number;
  totalEmployers: number;
  paidSubscriptions: number;
  revenue: number;
  reviewsPerDay: number;
  reputationHistogram: { bucket: string; count: number }[];
};

const DEFAULT_OVERVIEW: Overview = {
  totalUsers: 0,
  totalEmployers: 0,
  paidSubscriptions: 0,
  revenue: 0,
  reviewsPerDay: 0,
  reputationHistogram: [],
};

function normalizeOverviewPayload(json: unknown): Overview {
  if (json == null || typeof json !== "object") return DEFAULT_OVERVIEW;
  const o = json as Record<string, unknown>;
  const hist = Array.isArray(o.reputationHistogram)
    ? (o.reputationHistogram as { bucket: string; count: number }[])
    : [];
  return {
    totalUsers: typeof o.totalUsers === "number" ? o.totalUsers : 0,
    totalEmployers: typeof o.totalEmployers === "number" ? o.totalEmployers : 0,
    paidSubscriptions: typeof o.paidSubscriptions === "number" ? o.paidSubscriptions : 0,
    revenue: typeof o.revenue === "number" ? o.revenue : 0,
    reviewsPerDay: typeof o.reviewsPerDay === "number" ? o.reviewsPerDay : 0,
    reputationHistogram: hist,
  };
}

const POLL_MS = 30_000;

function isAdminRole(role: string | undefined | null): boolean {
  const r = String(role ?? "").toLowerCase();
  return r === "admin" || r === "superadmin";
}

export function AdminOverviewClient() {
  const { data: sessionData } = useSupabaseSession();
  const role = (sessionData?.user as { app_metadata?: { role?: string } } | undefined)?.app_metadata?.role;
  const canFetch = isAdminRole(role);

  const [overviewData, setOverviewData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    if (!canFetch) return;
    try {
      const res = await fetch("/api/admin/dashboard/overview");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setOverviewData(normalizeOverviewPayload(json));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading overview");
    } finally {
      setLoading(false);
    }
  }, [canFetch]);

  useEffect(() => {
    if (!canFetch) {
      setLoading(false);
      return;
    }
    fetchOverview();
    const t = setInterval(fetchOverview, POLL_MS);
    return () => clearInterval(t);
  }, [canFetch, fetchOverview]);

  if (!canFetch) {
    return null;
  }
  if (loading && !overviewData) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-slate-500">Loading overview…</p>
      </div>
    );
  }

  if (error && !overviewData) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-800">{error}</p>
        <button
          type="button"
          onClick={() => { setLoading(true); fetchOverview(); }}
          className="mt-2 text-sm font-medium text-red-700 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const o = overviewData ?? DEFAULT_OVERVIEW;
  const histogram = Array.isArray(o.reputationHistogram) ? o.reputationHistogram : [];
  const maxCount = Math.max(1, ...histogram.map((h) => h.count));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total users" value={o.totalUsers} />
        <StatCard label="Employers" value={o.totalEmployers} />
        <StatCard label="Paid subs" value={o.paidSubscriptions} />
        <StatCard label="Revenue ($)" value={o.revenue.toFixed(2)} />
        <StatCard label="Reviews/day" value={o.reviewsPerDay} />
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Live</p>
          <p className="mt-1 text-lg font-semibold text-emerald-600">Updated every 30s</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Reputation distribution</h2>
        <div className="flex items-end gap-2 h-48">
          {histogram.map(({ bucket, count }) => (
            <div key={bucket} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-slate-200 rounded-t min-h-[4px] flex flex-col justify-end"
                style={{ height: "100%" }}
              >
                <div
                  className="w-full bg-indigo-600 rounded-t transition-all duration-300"
                  style={{ height: `${(count / maxCount) * 100}%`, minHeight: count ? 4 : 0 }}
                />
              </div>
              <span className="text-xs text-slate-600">{bucket}</span>
              <span className="text-xs font-medium text-slate-800">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
