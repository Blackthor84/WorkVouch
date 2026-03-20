"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type MatchRow = {
  id: string;
  status: string;
  company: string;
  user_1: string;
  user_2: string;
  created_at: string | null;
};

export function MatchesMonitorClient() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/control-center/matches", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      setMatches(Array.isArray(json.matches) ? json.matches : []);
    } catch {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-slate-500 p-6">Loading matches…</p>;
  }

  const labelStatus = (s: string) => {
    if (s === "confirmed") return "accepted";
    return s;
  };

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="p-4">Company</th>
              <th className="p-4">Status</th>
              <th className="p-4">User A</th>
              <th className="p-4">User B</th>
              <th className="p-4">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matches.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No data yet
                </td>
              </tr>
            ) : (
              matches.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50">
                  <td className="p-4 font-medium text-slate-900">{m.company}</td>
                  <td className="p-4 capitalize text-slate-700">{labelStatus(m.status)}</td>
                  <td className="p-4">
                    {m.user_1 ? (
                      <Link href={`/admin/users/${m.user_1}`} className="text-blue-700 hover:underline font-mono text-xs">
                        {m.user_1.slice(0, 8)}…
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-4">
                    {m.user_2 ? (
                      <Link href={`/admin/users/${m.user_2}`} className="text-blue-700 hover:underline font-mono text-xs">
                        {m.user_2.slice(0, 8)}…
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-4 text-slate-500 whitespace-nowrap">
                    {m.created_at ? new Date(m.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
