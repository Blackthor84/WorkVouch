"use client";

import { useEffect, useState } from "react";

type FinancialsData = {
  totalRevenue: number;
  MRR: number;
  ARR: number;
  activeSubscriptions: number;
};

type ForecastData = {
  currentMRR: number;
  monthlyGrowthRate: number;
  forecast: { month: number; projectedMRR: number }[];
};

type HealthData = {
  activeSubscriptions: number;
  churnRate: number;
  ARPA: number;
  estimatedLTV: number | null;
};

function Card({
  title,
  value,
  prefix = "",
  tooltip,
}: {
  title: string;
  value: number | string;
  prefix?: string;
  tooltip?: string;
}) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-[#64748B]">{title}</span>
        {tooltip && (
          <span
            className="cursor-help text-[#94A3B8]"
            title={tooltip}
            aria-label={tooltip}
          >
            ⓘ
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold text-[#0F172A]">
        {prefix}
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

function ForecastChart({ forecast, currentMRR }: { forecast: { month: number; projectedMRR: number }[]; currentMRR: number }) {
  if (forecast.length === 0) return null;
  const values = [currentMRR, ...forecast.map((f) => f.projectedMRR)];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 600;
  const h = 220;
  const padding = { top: 16, right: 16, bottom: 24, left: 48 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;
  const points = values.map((v, i) => {
    const x = padding.left + (i / (values.length - 1)) * chartW;
    const y = padding.top + chartH - ((v - min) / range) * chartH;
    return `${x},${y}`;
  });
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <div className="mb-4 text-sm font-medium text-[#64748B]">
        Projection (assumes constant growth)
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-full" preserveAspectRatio="xMidYMid meet">
        {values.map((v, i) => (
          <text
            key={i}
            x={padding.left + (i / (values.length - 1)) * chartW}
            y={h - 4}
            textAnchor="middle"
            className="fill-[#64748B] text-[10px]"
          >
            {i === 0 ? "Now" : `M${i}`}
          </text>
        ))}
        <polyline
          fill="none"
          stroke="#2563EB"
          strokeWidth="2"
          points={points.join(" ")}
        />
      </svg>
    </div>
  );
}

export function FinancialsClient() {
  const [data, setData] = useState<FinancialsData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const ok = (r: Response) => {
      if (!r.ok) throw new Error(r.status === 403 ? "Forbidden" : "Failed to load");
      return r.json();
    };
    Promise.all([
      fetch("/api/admin/financials").then(ok),
      fetch("/api/admin/financials/forecast").then(ok),
      fetch("/api/admin/financials/health").then(ok),
    ])
      .then(([d, f, h]) => {
        if (!cancelled) {
          setData(d);
          setForecast(f);
          setHealth(h);
        }
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
    return <p className="text-slate-500">Loading financials…</p>;
  }
  if (error) {
    return <p className="text-red-600">{error}</p>;
  }
  if (!data) return null;

  return (
    <>
      <p className="mb-6 text-sm text-[#64748B]">
        All figures are aggregated. No per-employer or per-user amounts are shown.
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Total Revenue" value={data.totalRevenue} prefix="$" />
        <Card title="MRR" value={data.MRR} prefix="$" />
        <Card title="ARR" value={data.ARR} prefix="$" />
        <Card title="Active Subscriptions" value={data.activeSubscriptions} />
      </div>

      {forecast && forecast.forecast.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-[#0F172A]">Revenue forecast</h2>
          <ForecastChart forecast={forecast.forecast} currentMRR={forecast.currentMRR} />
        </div>
      )}

      {health && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-[#0F172A]">Churn & LTV</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Churn" value={`${(health.churnRate * 100).toFixed(1)}%`} />
            <Card title="ARPA" value={health.ARPA} prefix="$" />
            <Card
              title="LTV"
              value={health.estimatedLTV != null ? health.estimatedLTV : "—"}
              prefix={health.estimatedLTV != null ? "$" : ""}
              tooltip="LTV is calculated using standard SaaS methodology (ARPA / churn rate)."
            />
            <Card title="Active subs" value={health.activeSubscriptions} />
          </div>
        </div>
      )}
    </>
  );
}
