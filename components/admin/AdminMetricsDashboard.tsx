"use client";

import { useEffect, useState } from "react";

type MetricsPayload = {
  total: number;
  sent: number;
  opened: number;
  accepted: number;
  openRate: string;
  acceptRate: string;
  declined?: number;
  invite_dispatched?: number;
  error?: string;
};

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow dark:bg-slate-900 dark:shadow-none dark:ring-1 dark:ring-slate-700">
      <div className="text-sm text-gray-500 dark:text-slate-400">{title}</div>
      <div className="text-xl font-bold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

export default function AdminMetricsDashboard() {
  const [data, setData] = useState<MetricsPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/metrics", { credentials: "include" })
      .then((res) => res.json().then((j) => ({ res, j })))
      .then(({ res, j }) => {
        if (cancelled) return;
        if (!res.ok) {
          setData({
            total: 0,
            sent: 0,
            opened: 0,
            accepted: 0,
            openRate: "0",
            acceptRate: "0",
            error: typeof j?.error === "string" ? j.error : "Could not load metrics",
          });
          return;
        }
        setData(j as MetricsPayload);
      })
      .catch(() => {
        if (!cancelled) {
          setData({
            total: 0,
            sent: 0,
            opened: 0,
            accepted: 0,
            openRate: "0",
            acceptRate: "0",
            error: "Network error",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return <div className="p-6 text-slate-600 dark:text-slate-400">Loading…</div>;
  }

  if (data.error) {
    return (
      <div className="p-6">
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {data.error}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">WorkVouch Metrics</h1>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Coworker invite funnel (platform totals). Aggregated only — no per-user rows.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Card title="Total Invites" value={data.total} />
        <Card title="Invites Sent" value={data.sent} />
        <Card title="Opened" value={data.opened} />
        <Card title="Accepted" value={data.accepted} />
        <Card title="Open Rate" value={`${data.openRate}%`} />
        <Card title="Acceptance Rate" value={`${data.acceptRate}%`} />
      </div>

      {typeof data.declined === "number" || typeof data.invite_dispatched === "number" ? (
        <div className="mt-6 grid grid-cols-2 gap-4">
          {typeof data.declined === "number" ? <Card title="Declined" value={data.declined} /> : null}
          {typeof data.invite_dispatched === "number" ? (
            <Card title="Invite dispatched (email/SMS)" value={data.invite_dispatched} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
