"use client";

import { useEffect, useState } from "react";

type MetricsData = {
  users: number;
  weeklyActive: number;
  employers: number;
  referencesPerUser: number;
  verificationRate: number;
  statesActive: number;
  countriesActive: number;
};

const LABELS: Record<keyof MetricsData, string> = {
  users: "Total users",
  weeklyActive: "Weekly active users",
  employers: "Employers onboarded",
  referencesPerUser: "References per user",
  verificationRate: "Verification rate",
  statesActive: "States active",
  countriesActive: "Countries active",
};

export function MetricsView() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then(setMetrics)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-slate-500">Unable to load metrics.</p>;
  if (!metrics) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {(Object.keys(LABELS) as (keyof MetricsData)[]).map((key) => (
        <div key={key} className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <p className="text-3xl font-bold text-slate-900">{metrics[key]}</p>
          <p className="mt-1 text-xs text-slate-500">{LABELS[key]}</p>
        </div>
      ))}
    </div>
  );
}
