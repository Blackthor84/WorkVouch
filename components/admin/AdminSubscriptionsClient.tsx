"use client";

import { useEffect, useState } from "react";

export function AdminSubscriptionsClient() {
  const [data, setData] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/financials")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (!data) return <p className="text-slate-500">No data.</p>;

  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Active</p><p className="text-2xl font-bold">{data.activeSubscriptions ?? 0}</p></div>
      <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">MRR</p><p className="text-2xl font-bold">${(data.MRR ?? 0).toFixed(2)}</p></div>
      <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">ARR</p><p className="text-2xl font-bold">${(data.ARR ?? 0).toFixed(2)}</p></div>
      <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">Revenue</p><p className="text-2xl font-bold">${(data.totalRevenue ?? 0).toFixed(2)}</p></div>
    </div>
  );
}
