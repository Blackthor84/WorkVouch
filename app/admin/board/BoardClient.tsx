"use client";

import { useEffect, useState } from "react";

type BoardData = {
  asOf: string;
  growth: { users: number; employers: number; weeklyActive: number };
  revenue: {
    totalRevenue: number;
    MRR: number;
    ARR: number;
    forecast: { month: number; projectedMRR: number }[];
  };
  health: {
    churnRate: number;
    ARPA: number;
    estimatedLTV: number | null;
    activeSubscriptions: number;
  };
  expansion: { statesActive: number; countriesActive: number };
};

function BigNum({ label, value, prefix = "" }: { label: string; value: number | string; prefix?: string }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wider text-[#64748B]">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-[#0F172A]">
        {prefix}
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

export function BoardClient() {
  const [data, setData] = useState<BoardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/board")
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 403 ? "Forbidden" : "Failed to load");
        return res.json();
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Request failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-[#64748B]">Loading board snapshot…</p>;
  }
  if (error) {
    return <p className="text-red-600">{error}</p>;
  }
  if (!data) return null;

  const asOf = new Date(data.asOf).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#0F172A]">Board</h1>
        <p className="text-sm text-[#64748B]">As of {asOf}</p>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#64748B]">Growth</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <BigNum label="Total users" value={data.growth.users} />
          <BigNum label="Employers" value={data.growth.employers} />
          <BigNum label="Weekly active users" value={data.growth.weeklyActive} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#64748B]">Revenue</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <BigNum label="Total revenue" value={data.revenue.totalRevenue} prefix="$" />
          <BigNum label="MRR" value={data.revenue.MRR} prefix="$" />
          <BigNum label="ARR" value={data.revenue.ARR} prefix="$" />
        </div>
        <p className="mt-2 text-xs text-[#64748B]">12‑month projection assumes constant growth rate.</p>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#64748B]">Health</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <BigNum label="Churn rate" value={`${(data.health.churnRate * 100).toFixed(1)}%`} />
          <BigNum label="ARPA" value={data.health.ARPA} prefix="$" />
          <BigNum
            label="Est. LTV"
            value={data.health.estimatedLTV != null ? data.health.estimatedLTV : "—"}
            prefix={data.health.estimatedLTV != null ? "$" : ""}
          />
          <BigNum label="Active subscriptions" value={data.health.activeSubscriptions} />
        </div>
        <p className="mt-2 text-xs text-[#64748B]">LTV is calculated using standard SaaS methodology.</p>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[#64748B]">Expansion</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BigNum label="States active" value={data.expansion.statesActive} />
          <BigNum label="Countries active" value={data.expansion.countriesActive} />
        </div>
      </section>
    </div>
  );
}
