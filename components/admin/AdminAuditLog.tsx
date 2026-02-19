"use client";

import { useEffect, useState } from "react";

type AuditRow = {
  id: string;
  created_at: string;
  admin_email: string | null;
  action: string;
  scenario_id: string | null;
  metadata: Record<string, unknown> | null;
};

export function AdminAuditLog() {
  const [data, setData] = useState<AuditRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit-log-view?limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((rows) => setData(Array.isArray(rows) ? rows : []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-slate-500 p-4">Loading…</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Created
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Admin email
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Action
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Scenario ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Metadata
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {!data?.length ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                No audit log entries.
              </td>
            </tr>
          ) : (
            data.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">{r.admin_email ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-900">{r.action ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                  {r.scenario_id ?? "—"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-w-md">
                    {JSON.stringify(r.metadata ?? {}, null, 2)}
                  </pre>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
