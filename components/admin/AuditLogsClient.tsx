"use client";

import { useEffect, useState, useCallback } from "react";

type LogRow = {
  id: string;
  admin_user_id: string;
  admin_email: string | null;
  admin_role: string | null;
  action_type: string;
  target_type: string | null;
  target_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  reason: string | null;
  is_sandbox: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export function AuditLogsClient() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminId, setAdminId] = useState("");
  const [action, setAction] = useState("");
  const [isSandbox, setIsSandbox] = useState<"all" | "true" | "false">("all");
  const [detailId, setDetailId] = useState<string | null>(null);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", "200");
    if (adminId.trim()) params.set("admin_id", adminId.trim());
    if (action.trim()) params.set("action", action.trim());
    if (isSandbox !== "all") params.set("is_sandbox", isSandbox);
    fetch(`/api/admin/audit-logs?${params}`)
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [adminId, action, isSandbox]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const detailLog = detailId ? logs.find((l) => l.id === detailId) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Admin ID</span>
          <input
            type="text"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            placeholder="UUID"
            className="rounded border border-slate-300 px-2 py-1 text-sm w-48"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Action</span>
          <input
            type="text"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="e.g. suspend"
            className="rounded border border-slate-300 px-2 py-1 text-sm w-32"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Sandbox</span>
          <select
            value={isSandbox}
            onChange={(e) => setIsSandbox(e.target.value as "all" | "true" | "false")}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="true">Sandbox only</option>
            <option value="false">Production only</option>
          </select>
        </label>
        <button
          type="button"
          onClick={fetchLogs}
          className="rounded bg-slate-700 px-3 py-1 text-sm text-white hover:bg-slate-800"
        >
          Apply
        </button>
      </div>

      {loading && <p className="text-slate-500">Loading...</p>}

      {!loading && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Admin role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Target type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Target ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Sandbox</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">{log.admin_role ?? "—"}</td>
                  <td className="px-4 py-3 text-sm font-medium">{log.action_type}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{log.target_type ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 truncate max-w-[120px]" title={log.target_id ?? ""}>
                    {log.target_id ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {log.is_sandbox ? (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 text-xs">Sandbox</span>
                    ) : (
                      <span className="text-slate-500">Prod</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => setDetailId(detailId === log.id ? null : log.id)}
                      className="text-blue-600 hover:underline"
                    >
                      {detailId === log.id ? "Hide" : "Before/After"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && <p className="p-4 text-slate-500">No audit log entries.</p>}
        </div>
      )}

      {detailLog && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-medium text-slate-900 mb-2">Audit detail (before / after)</h3>
          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="font-medium text-slate-600 mb-1">Before</p>
              <pre className="overflow-auto rounded bg-white p-2 text-xs border border-slate-200 max-h-48">
                {detailLog.before_state != null ? JSON.stringify(detailLog.before_state, null, 2) : "—"}
              </pre>
            </div>
            <div>
              <p className="font-medium text-slate-600 mb-1">After</p>
              <pre className="overflow-auto rounded bg-white p-2 text-xs border border-slate-200 max-h-48">
                {detailLog.after_state != null ? JSON.stringify(detailLog.after_state, null, 2) : "—"}
              </pre>
            </div>
          </div>
          {detailLog.reason && (
            <p className="mt-2 text-sm text-slate-700"><strong>Reason:</strong> {detailLog.reason}</p>
          )}
        </div>
      )}

      <ImpersonationAuditSection />
    </div>
  );
}

type ImpersonationRow = {
  id: string;
  admin_user_id: string;
  admin_email: string | null;
  target_user_id: string | null;
  target_identifier: string | null;
  event: string;
  environment: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

function ImpersonationAuditSection() {
  const [rows, setRows] = useState<ImpersonationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/audit-logs/impersonation?limit=100")
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold text-slate-900">Impersonation audit (read-only)</h2>
      <p className="text-sm text-slate-600">Every impersonation start/end. SOC-2.</p>
      {loading && <p className="text-slate-500">Loading…</p>}
      {!loading && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Admin</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Event</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Environment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">{new Date(row.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">{row.admin_email ?? row.admin_user_id}</td>
                  <td className="px-4 py-3 text-sm font-medium">{row.event}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{row.target_identifier ?? row.target_user_id ?? "—"}</td>
                  <td className="px-4 py-3 text-sm">{row.environment === "sandbox" ? <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 text-xs">Sandbox</span> : "Production"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="p-4 text-slate-500">No impersonation audit entries.</p>}
        </div>
      )}
    </div>
  );
}
