"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type IncidentRow = {
  id: string;
  incident_type: string;
  severity: string;
  title: string;
  description: string;
  environment: string;
  status: string;
  detected_at: string;
  mitigated_at: string | null;
  resolved_at: string | null;
  triggered_by: string | null;
  related_alert_ids: string[];
  affected_users: number | null;
  affected_employers: number | null;
  created_at: string;
};

type IncidentActionRow = {
  id: string;
  incident_id: string;
  admin_user_id: string | null;
  admin_role: string | null;
  action_type: string;
  action_metadata: Record<string, unknown>;
  created_at: string;
};

interface IncidentsClientProps {
  isSuperAdmin: boolean;
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; className: string }> = {
    critical: { label: "CRITICAL", className: "bg-red-100 text-red-800" },
    high: { label: "HIGH", className: "bg-orange-100 text-orange-800" },
    medium: { label: "MEDIUM", className: "bg-amber-100 text-amber-800" },
    low: { label: "LOW", className: "bg-slate-100 text-slate-700" },
  };
  const s = map[severity] ?? { label: severity, className: "bg-slate-100 text-slate-600" };
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

export function IncidentsClient({ isSuperAdmin }: IncidentsClientProps) {
  const [incidents, setIncidents] = useState<IncidentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ incident: IncidentRow; actions: IncidentActionRow[] } | null>(null);
  const [filterEnv, setFilterEnv] = useState<"" | "prod" | "sandbox">("");
  const [filterStatus, setFilterStatus] = useState<"" | "open" | "mitigated" | "resolved">("open");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [newActionType, setNewActionType] = useState("mitigation_note");
  const [newActionReason, setNewActionReason] = useState("");
  const [exporting, setExporting] = useState(false);

  const fetchIncidents = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("limit", "100");
    if (filterEnv) params.set("environment", filterEnv);
    if (filterStatus) params.set("status", filterStatus);
    if (filterSeverity) params.set("severity", filterSeverity);
    fetch(`/api/admin/incidents?${params}`)
      .then((r) => r.json())
      .then((data) => setIncidents(Array.isArray(data) ? data : []))
      .catch(() => setIncidents([]))
      .finally(() => setLoading(false));
  }, [filterEnv, filterStatus, filterSeverity]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  useEffect(() => {
    if (!detailId) {
      setDetail(null);
      return;
    }
    fetch(`/api/admin/incidents/${detailId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.incident) setDetail({ incident: data.incident, actions: data.actions ?? [] });
        else setDetail(null);
      })
      .catch(() => setDetail(null));
  }, [detailId]);

  const patchStatus = async (id: string, status: "mitigated" | "resolved") => {
    if (!statusReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason: statusReason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Failed");
        return;
      }
      setStatusReason("");
      setDetailId(null);
      setDetail(null);
      fetchIncidents();
    } finally {
      setActionLoading(false);
    }
  };

  const addAction = async (id: string) => {
    if (!newActionReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/incidents/${id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action_type: newActionType, reason: newActionReason, action_metadata: {} }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Failed");
        return;
      }
      setNewActionReason("");
      if (detailId === id) {
        fetch(`/api/admin/incidents/${id}`)
          .then((r) => r.json())
          .then((data) => data?.incident && setDetail({ incident: data.incident, actions: data.actions ?? [] }));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const doExport = (format: "json" | "csv") => {
    setExporting(true);
    const params = new URLSearchParams();
    params.set("format", format);
    if (filterEnv) params.set("environment", filterEnv);
    if (filterStatus) params.set("status", filterStatus);
    fetch(`/api/admin/incidents/export?${params}`)
      .then((r) => {
        if (format === "csv") return r.text();
        return r.json();
      })
      .then((data) => {
        if (format === "csv") {
          const blob = new Blob([data], { type: "text/csv" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `incidents-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(a.href);
        } else {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `incidents-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(a.href);
        }
      })
      .catch(() => alert("Export failed"))
      .finally(() => setExporting(false));
  };

  const incident = detail?.incident;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <span className="text-sm font-medium text-slate-600">View:</span>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as "" | "open" | "mitigated" | "resolved")}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="open">Open</option>
          <option value="mitigated">Mitigated</option>
          <option value="resolved">Resolved</option>
          <option value="">All</option>
        </select>
        <select
          value={filterEnv}
          onChange={(e) => setFilterEnv(e.target.value as "" | "prod" | "sandbox")}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="">All env</option>
          <option value="prod">Production</option>
          <option value="sandbox">Sandbox</option>
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm"
        >
          <option value="">All severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <Button variant="outline" size="sm" onClick={fetchIncidents}>Refresh</Button>
        <Button variant="outline" size="sm" disabled={exporting} onClick={() => doExport("json")}>
          Export JSON
        </Button>
        <Button variant="outline" size="sm" disabled={exporting} onClick={() => doExport("csv")}>
          Export CSV
        </Button>
      </div>

      {loading && <p className="text-slate-500">Loading…</p>}

      {!loading && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Detected</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Env</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Scope</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {new Date(inc.detected_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3"><SeverityBadge severity={inc.severity} /></td>
                  <td className="px-4 py-3 text-sm font-medium">{inc.title}</td>
                  <td className="px-4 py-3 text-sm">
                    {inc.environment === "sandbox" ? (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 text-xs">Sandbox</span>
                    ) : (
                      <span className="text-slate-500">Prod</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{inc.status}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {inc.affected_users != null || inc.affected_employers != null
                      ? `Users: ${inc.affected_users ?? "—"} / Employers: ${inc.affected_employers ?? "—"}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => setDetailId(detailId === inc.id ? null : inc.id)}
                      className="text-blue-600 hover:underline"
                    >
                      {detailId === inc.id ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {incidents.length === 0 && (
            <p className="p-4 text-slate-500">No incidents in this view.</p>
          )}
        </div>
      )}

      {detail && incident && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{incident.title}</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <SeverityBadge severity={incident.severity} />
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">{incident.incident_type}</span>
            <span className={incident.environment === "sandbox" ? "rounded bg-amber-100 px-1.5 py-0.5 text-amber-800 text-xs" : "text-slate-500 text-sm"}>
              {incident.environment}
            </span>
            <span className="text-slate-500 text-sm">Status: {incident.status}</span>
          </div>
          <p className="text-sm text-slate-700 mb-3">{incident.description}</p>
          {incident.triggered_by && (
            <p className="text-xs text-slate-500 mb-3">Triggered by: {incident.triggered_by}</p>
          )}
          {incident.related_alert_ids?.length > 0 && (
            <p className="text-sm mb-3">
              <Link href="/admin/alerts" className="text-blue-600 hover:underline">Related alerts →</Link>
            </p>
          )}

          <h4 className="font-medium text-slate-800 mt-4 mb-2">Timeline</h4>
          <ul className="space-y-1 text-sm max-h-48 overflow-auto mb-4">
            {detail.actions.map((a) => (
              <li key={a.id} className="flex gap-2">
                <span className="text-slate-500 shrink-0">{new Date(a.created_at).toLocaleString()}</span>
                <span className="font-mono">{a.action_type}</span>
                {a.admin_role && <span className="text-slate-500">({a.admin_role})</span>}
              </li>
            ))}
          </ul>

          {incident.status === "open" && (
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Reason (required)"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="rounded border border-slate-300 px-2 py-1 text-sm w-64"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!statusReason.trim() || actionLoading}
                  onClick={() => patchStatus(incident.id, "mitigated")}
                >
                  Mark mitigated
                </Button>
                {isSuperAdmin || incident.severity !== "critical" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!statusReason.trim() || actionLoading}
                    onClick={() => patchStatus(incident.id, "resolved")}
                  >
                    Resolve
                  </Button>
                ) : (
                  <span className="text-xs text-amber-700">CRITICAL: only superadmin can resolve</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={newActionType}
                  onChange={(e) => setNewActionType(e.target.value)}
                  className="rounded border border-slate-300 px-2 py-1 text-sm"
                >
                  <option value="mitigation_note">Mitigation note</option>
                  <option value="escalation">Escalation</option>
                  <option value="response_action">Response action</option>
                </select>
                <input
                  type="text"
                  placeholder="Reason / note"
                  value={newActionReason}
                  onChange={(e) => setNewActionReason(e.target.value)}
                  className="rounded border border-slate-300 px-2 py-1 text-sm w-64"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!newActionReason.trim() || actionLoading}
                  onClick={() => addAction(incident.id)}
                >
                  Add action
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 mt-4">
            All actions are audited. View <Link href="/admin/audit-logs" className="text-blue-600 hover:underline">Audit Logs</Link> for full trail.
          </p>
        </div>
      )}
    </div>
  );
}
