"use client";

import { useEffect, useState } from "react";

type LogRow = {
  id: string;
  actor_role: string | null;
  action: string;
  target_user_id: string | null;
  metadata: unknown;
  created_at: string;
};

export function AuditLogsClient() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit-logs?limit=100")
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-[#64748B]">Loading...</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white dark:border-gray-700 dark:bg-gray-800">
      <table className="min-w-full divide-y divide-[#E2E8F0] dark:divide-gray-700">
        <thead className="bg-slate-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Time</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Actor role</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Action</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Target</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] dark:divide-gray-700">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-gray-700/30">
              <td className="px-4 py-3 text-sm text-[#64748B]">{new Date(log.created_at).toLocaleString()}</td>
              <td className="px-4 py-3 text-sm">{log.actor_role ?? "—"}</td>
              <td className="px-4 py-3 text-sm">{log.action}</td>
              <td className="px-4 py-3 text-sm text-[#64748B]">{log.target_user_id ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && <p className="p-4 text-[#64748B]">No audit log entries.</p>}
    </div>
  );
}
