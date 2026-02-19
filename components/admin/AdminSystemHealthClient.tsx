"use client";

import { useEffect, useState } from "react";

type ErrorsData = { windowHours: number; totalErrorEvents: number; totalPageViews: number; errorRate: number };

export function AdminSystemHealthClient() {
  const [errors, setErrors] = useState<ErrorsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics/errors?hours=24")
      .then((r) => r.ok ? r.json() : null)
      .then(setErrors)
      .catch(() => setErrors(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white p-8"><p className="text-slate-500">Loading…</p></div>;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Error rates (last 24h)</h2>
        {errors ? (
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-slate-500">Error events</dt><dd className="font-semibold">{errors.totalErrorEvents}</dd></div>
            <div><dt className="text-slate-500">Page views</dt><dd className="font-semibold">{errors.totalPageViews}</dd></div>
            <div><dt className="text-slate-500">Error rate %</dt><dd className="font-semibold">{errors.errorRate?.toFixed(2) ?? "0"}%</dd></div>
          </dl>
        ) : (
          <p className="text-slate-500">No data or unavailable.</p>
        )}
      </div>
      <p className="text-sm text-slate-500">Full system settings: <a href="/admin/system" className="text-blue-600 hover:underline">System</a></p>
    </div>
  );
}
