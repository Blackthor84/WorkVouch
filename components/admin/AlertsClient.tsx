"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type AlertRow = {
  id: string;
  category: string;
  alert_type: string;
  severity: string;
  title: string;
  summary: string;
  context: Record<string, unknown>;
  recommended_action: string | null;
  is_sandbox: boolean;
  status: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  dismissed_by: string | null;
  dismissed_at: string | null;
  silenced_until: string | null;
  escalation_count: number;
  source_ref: Record<string, unknown>;
  created_at: string;
};

interface AlertsClientProps {
  isSuperAdmin: boolean;
  isSandbox: boolean;
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; className: string }> = {
    critical: { label: "CRITICAL", className: "bg-red-100 text-red-800" },
    warning: { label: "WARNING", className: "bg-amber-100 text-amber-800" },
    info: { label: "INFO", className: "bg-slate-100 text-slate-700" },
  };
  const s = map[severity] ?? { label: severity, className: "bg-slate-100 text-slate-600" };
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

export function AlertsClient({ isSuperAdmin, isSandbox }: AlertsClientProps) {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AlertRow | null>(null);
  const [filterSandbox, setFilterSandbox] = useState<"all" | "true" | "false">(
    isSandbox ? "true" : "false"
  );
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState("");
  const [silenceUntil, setSilenceUntil] = useState("");

  const fetchAlerts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", "100");
    if (filterSandbox !== "all") params.set("is_sandbox", filterSandbox);
    if (filterSeverity) params.set("severity", filterSeverity);
    if (filterCategory) params.set("category", filterCategory);
    if (filterStatus) params.set("status", filterStatus);
    fetch(`/api/admin/alerts?${params}`)
      .then((r) => r.json())
      .then((data) => setAlerts(Array.isArray(data) ? data : []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, [filterSandbox, filterSeverity, filterCategory, filterStatus]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    const found = alerts.find((a) => a.id === detailId);
    if (found) {
      setDetail(found);
      return;
    }
    fetch(`/api/admin/alerts/${detailId}`)
      .then((r) => r.json())
      .then((data) => setDetail(data?.id ? data : null))
      .catch(() => setDetail(null));
  }, [detailId, alerts]);

  const patchAlert = async (id: string, action: string, extra?: Record<string, string>) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/alerts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Action failed");
        return;
      }
      setDetailId(null);
      setDetail(null);
      fetchAlerts();
    } finally {
      setActionLoading(null);
    }
  };

  const auditLogsHref = "/admin/audit-logs";
  const sourceRef = detail?.source_ref as Record<string, string> | undefined;
  const auditId = sourceRef?.audit_log_id ?? sourceRef?.abuse_signal_id;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Environment</span>
          <select
            value={filterSandbox}
            onChange={(e) => setFilterSandbox(e.target.value as "all" | "true" | "false")}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="true">Sandbox only</option>
            <option value="false">Production only</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Severity</span>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="">All</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Category</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="">All</option>
            <option value="security">Security</option>
            <option value="trust_safety">Trust & Safety</option>
            <option value="system">System</option>
            <option value="sandbox">Sandbox</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Status</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="">All</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="dismissed">Dismissed</option>
            <option value="escalated">Escalated</option>
          </select>
        </label>
        <Button type="button" variant="outline" size="sm" onClick={fetchAlerts}>
          Refresh
        </Button>
      </div>

      {filterSandbox === "all" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Showing both sandbox and production alerts. Use filters to separate.
        </div>
      )}

      {loading && <p className="text-slate-500">Loading...</p>}

      {!loading && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Env</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {alerts.map((alert) => (
                <tr
                  key={alert.id}
                  className={`hover:bg-slate-50 ${detailId === alert.id ? "bg-slate-100" : ""}`}
                >
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(alert.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <SeverityBadge severity={alert.severity} />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{alert.category}</td>
                  <td className="px-4 py-3 text-sm font-medium">{alert.title}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{alert.status}</td>
                  <td className="px-4 py-3 text-sm">
                    {alert.is_sandbox ? (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 text-xs">Sandbox</span>
                    ) : (
                      <span className="text-slate-500">Prod</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => setDetailId(detailId === alert.id ? null : alert.id)}
                      className="text-blue-600 hover:underline"
                    >
                      {detailId === alert.id ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {alerts.length === 0 && (
            <p className="p-4 text-slate-500">No alerts in this view. Change filters or wait for new alerts.</p>
          )}
        </div>
      )}

      {detail && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{detail.title}</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <SeverityBadge severity={detail.severity} />
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">{detail.category}</span>
            <span className="text-slate-500 text-sm">{detail.alert_type}</span>
            {detail.is_sandbox && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 text-xs">Sandbox</span>
            )}
          </div>
          <p className="text-sm text-slate-700 mb-3">{detail.summary}</p>
          {detail.recommended_action && (
            <p className="text-sm text-slate-800 mb-3">
              <strong>Recommended action:</strong> {detail.recommended_action}
            </p>
          )}
          {Object.keys(detail.context ?? {}).length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-slate-600 mb-1">Context</p>
              <pre className="overflow-auto rounded bg-slate-50 p-2 text-xs border border-slate-200 max-h-32">
                {JSON.stringify(detail.context, null, 2)}
              </pre>
            </div>
          )}
          {auditId && (
            <p className="text-sm mb-3">
              <Link href={auditLogsHref} className="text-blue-600 hover:underline">
                View in Audit Logs →
              </Link>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200">
            {detail.status === "new" || detail.status === "read" ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!!actionLoading}
                  onClick={() => patchAlert(detail.id, "read")}
                >
                  Mark read
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!!actionLoading}
                  onClick={() => patchAlert(detail.id, "acknowledge")}
                >
                  Acknowledge
                </Button>
                {detail.severity === "critical" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Reason (required to dismiss critical)"
                      value={dismissReason}
                      onChange={(e) => setDismissReason(e.target.value)}
                      className="rounded border border-slate-300 px-2 py-1 text-sm w-56"
                    />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!!actionLoading || (detail.severity === "critical" && !dismissReason.trim())}
                  onClick={() => patchAlert(detail.id, "dismiss", { reason: dismissReason || "Dismissed from UI" })}
                >
                  Dismiss
                </Button>
              </>
            ) : null}
            {isSuperAdmin && (detail.status === "new" || detail.status === "read") && (
              <>
                <input
                  type="datetime-local"
                  value={silenceUntil}
                  onChange={(e) => setSilenceUntil(e.target.value)}
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!!actionLoading || !silenceUntil}
                  onClick={() => patchAlert(detail.id, "silence", { silenced_until: new Date(silenceUntil).toISOString(), reason: "Silenced from UI" })}
                >
                  Silence until
                </Button>
              </>
            )}
            {actionLoading === detail.id && <span className="text-slate-500 text-sm">Updating...</span>}
          </div>
        </div>
      )}
    </div>
  );
}
