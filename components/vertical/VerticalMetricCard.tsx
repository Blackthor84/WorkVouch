"use client";

import type { VerticalDashboardMetric } from "@/lib/verticals/dashboard";

interface VerticalMetricCardProps {
  metric: VerticalDashboardMetric;
  value: number | string | null;
}

export function VerticalMetricCard({ metric, value }: VerticalMetricCardProps) {
  const display =
    value === null || value === undefined
      ? "—"
      : typeof value === "number"
        ? Number.isInteger(value)
          ? String(value)
          : value.toFixed(1)
        : String(value);

  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800 p-6">
      <h2 className="text-lg font-semibold text-white">{metric.label}</h2>
      <p className="mb-2 text-sm text-slate-400">{metric.description}</p>
      <div className="text-3xl font-bold text-white">{display}</div>
    </div>
  );
}
