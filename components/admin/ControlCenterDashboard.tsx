"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Metrics = {
  totalUsers: number;
  totalMatches: number;
  totalReviews: number;
  avgTrust: number;
  trustHistogram: { bucket: string; count: number }[];
};

const empty: Metrics = {
  totalUsers: 0,
  totalMatches: 0,
  totalReviews: 0,
  avgTrust: 0,
  trustHistogram: [],
};

export function ControlCenterDashboard() {
  const [data, setData] = useState<Metrics>(empty);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/control-center/metrics", {
        credentials: "include",
      });
      const json = await res.json().catch(() => empty);
      if (!res.ok) {
        setData(empty);
        return;
      }
      setData({
        totalUsers: Number(json.totalUsers) || 0,
        totalMatches: Number(json.totalMatches) || 0,
        totalReviews: Number(json.totalReviews) || 0,
        avgTrust: Number(json.avgTrust) || 0,
        trustHistogram: Array.isArray(json.trustHistogram) ? json.trustHistogram : [],
      });
    } catch {
      setData(empty);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-8 shadow-sm">
        <p className="text-slate-500">Loading control center…</p>
      </div>
    );
  }

  const maxH = Math.max(1, ...data.trustHistogram.map((h) => h.count));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total users"
          value={data.totalUsers.toLocaleString()}
          accent="border-l-[3px] border-l-blue-600"
        />
        <MetricCard
          label="Coworker matches"
          value={data.totalMatches.toLocaleString()}
          accent="border-l-[3px] border-l-blue-500"
        />
        <MetricCard
          label="Reviews"
          value={data.totalReviews.toLocaleString()}
          accent="border-l-[3px] border-l-indigo-500"
        />
        <MetricCard
          label="Avg trust"
          value={`★ ${data.avgTrust}`}
          accent="border-l-[3px] border-l-amber-500"
        />
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Trust distribution</h2>
        <p className="text-sm text-slate-500 mt-1">Aggregate scores across all users with trust data.</p>
        <div className="mt-6 flex items-end gap-2 h-44">
          {data.trustHistogram.map(({ bucket, count }) => (
            <div key={bucket} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              <div className="w-full bg-slate-100 rounded-t min-h-[6px] flex flex-col justify-end h-full">
                <div
                  className="w-full bg-blue-600 rounded-t transition-all"
                  style={{
                    height: `${(count / maxH) * 100}%`,
                    minHeight: count ? 6 : 0,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-500 text-center leading-tight">{bucket}</span>
              <span className="text-xs font-medium text-slate-800">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink href="/admin/users" title="User management" desc="Search, roles, trust" />
        <QuickLink href="/admin/trust" title="Trust system" desc="Distribution & recalc" />
        <QuickLink href="/admin/reviews" title="Review moderation" desc="Flag & remove" />
        <QuickLink href="/admin/matches" title="Match monitor" desc="Detect abuses" />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm ${accent}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}

function QuickLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
    >
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="text-sm text-slate-500 mt-1">{desc}</p>
    </Link>
  );
}
