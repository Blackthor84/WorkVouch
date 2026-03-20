"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type Row = {
  user_id: string;
  score: number;
  full_name: string | null;
  email: string | null;
};

export function TrustCenterClient() {
  const [distribution, setDistribution] = useState<{ bucket: string; count: number }[]>([]);
  const [topUsers, setTopUsers] = useState<Row[]>([]);
  const [lowestUsers, setLowestUsers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalcing, setRecalcing] = useState(false);
  const [recalcMsg, setRecalcMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/control-center/trust", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      setDistribution(Array.isArray(json.distribution) ? json.distribution : []);
      setTopUsers(Array.isArray(json.topUsers) ? json.topUsers : []);
      setLowestUsers(Array.isArray(json.lowestUsers) ? json.lowestUsers : []);
    } catch {
      setDistribution([]);
      setTopUsers([]);
      setLowestUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recalc = async () => {
    setRecalcing(true);
    setRecalcMsg(null);
    try {
      const res = await fetch("/api/admin/control-center/trust", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      setRecalcMsg(typeof json.message === "string" ? json.message : "Done.");
      await load();
    } finally {
      setRecalcing(false);
    }
  };

  if (loading) {
    return <p className="text-slate-500 p-6">Loading trust analytics…</p>;
  }

  const maxD = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Recalculate</h2>
          <p className="text-sm text-slate-500 mt-1">
            Runs intelligence refresh for the most recently created profiles (batch). Weight tuning — coming soon.
          </p>
        </div>
        <Button variant="primary" disabled={recalcing} onClick={() => recalc()}>
          {recalcing ? "Working…" : "Recalculate batch"}
        </Button>
      </div>
      {recalcMsg && (
        <p className="text-sm text-slate-600 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">{recalcMsg}</p>
      )}

      <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Score distribution</h2>
        <div className="mt-6 flex items-end gap-2 h-40">
          {distribution.map(({ bucket, count }) => (
            <div key={bucket} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-slate-100 rounded-t h-full flex flex-col justify-end min-h-[8px]">
                <div
                  className="w-full bg-blue-600 rounded-t"
                  style={{ height: `${(count / maxD) * 100}%`, minHeight: count ? 6 : 0 }}
                />
              </div>
              <span className="text-[10px] text-slate-500">{bucket}</span>
              <span className="text-xs font-medium">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <UserListCard title="Highest trust" rows={topUsers} />
        <UserListCard title="Lowest trust" rows={lowestUsers} />
      </div>
    </div>
  );
}

function UserListCard({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <ul className="mt-4 divide-y divide-slate-100">
        {rows.length === 0 ? (
          <li className="py-4 text-sm text-slate-500">No data yet</li>
        ) : (
          rows.map((r) => (
            <li key={r.user_id} className="py-3 flex justify-between gap-2 text-sm">
              <div>
                <Link href={`/admin/users/${r.user_id}`} className="font-medium text-blue-700 hover:underline">
                  {r.full_name || r.email || r.user_id.slice(0, 8)}
                </Link>
                <p className="text-slate-500 text-xs">{r.email}</p>
              </div>
              <span className="tabular-nums font-semibold text-slate-900">{Math.round(r.score)}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
