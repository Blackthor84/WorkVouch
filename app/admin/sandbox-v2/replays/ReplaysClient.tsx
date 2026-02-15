"use client";

/**
 * SANDBOX REPLAY — Forensic 3-panel UI. READ-ONLY. Replay cannot mutate sandbox state.
 * Why: Every trust decision must be explainable; replay references rule versions for audit.
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

const API = "/api/admin/sandbox-v2";

type Session = { id: string; name: string | null; status: string; created_at?: string };
type ReplaySession = {
  id: string;
  sandbox_id: string;
  name: string;
  status: string;
  snapshot_id: string | null;
  rule_version_id: string | null;
  created_at: string;
};
type ReplayEvent = {
  id: string;
  event_order: number;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  before_state: Record<string, unknown> | null;
  after_state: Record<string, unknown> | null;
  trust_score_before: number | null;
  trust_score_after: number | null;
  rule_version_id: string | null;
  reason: string | null;
  created_at: string;
};

const SEVERITY_BY_TYPE: Record<string, "low" | "medium" | "high" | "critical"> = {
  trust_score_update: "medium",
  penalty: "high",
  incident: "critical",
  admin_action: "high",
  playbook_action: "medium",
  overlap_verification: "medium",
  review: "low",
  employment_claim: "low",
};

function severityColor(s: string): string {
  switch (SEVERITY_BY_TYPE[s] ?? "low") {
    case "critical": return "bg-red-100 border-red-300 text-red-800";
    case "high": return "bg-amber-100 border-amber-300 text-amber-800";
    case "medium": return "bg-blue-50 border-blue-200 text-blue-800";
    default: return "bg-slate-50 border-slate-200 text-slate-700";
  }
}

export function ReplaysClient() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sandboxId, setSandboxId] = useState("");
  const [replays, setReplays] = useState<ReplaySession[]>([]);
  const [selectedReplay, setSelectedReplay] = useState<ReplaySession | null>(null);
  const [session, setSession] = useState<ReplaySession | null>(null);
  const [events, setEvents] = useState<ReplayEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ReplayEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [snapshotName, setSnapshotName] = useState("");
  const [replayName, setReplayName] = useState("");
  const ruleVersionLabel = selectedReplay?.rule_version_id ? "Rule ref: " + selectedReplay.rule_version_id.slice(0, 8) : "Rule version: —";

  useEffect(() => {
    fetch(API + "/sessions", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => (d.success && d.data ? setSessions(d.data as Session[]) : []));
  }, []);

  useEffect(() => {
    if (!sandboxId) return;
    setLoading(true);
    fetch(API + "/replays?sandbox_id=" + encodeURIComponent(sandboxId), { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setReplays(d.data as ReplaySession[]);
        else setReplays([]);
      })
      .finally(() => setLoading(false));
  }, [sandboxId]);

  const loadReplayDetail = useCallback((r: ReplaySession) => {
    setSelectedReplay(r);
    setSelectedEvent(null);
    fetch(API + "/replays/" + r.id, { credentials: "include" })
      .then((res) => res.json())
      .then((d) => {
        if (d.success) {
          setSession(d.session as ReplaySession);
          setEvents((d.events ?? []) as ReplayEvent[]);
        } else {
          setSession(null);
          setEvents([]);
        }
      });
  }, []);

  const createSnapshot = () => {
    if (!sandboxId) return;
    setLoading(true);
    fetch(API + "/replays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sandbox_id: sandboxId, action: "snapshot", name: snapshotName || undefined }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSnapshotName("");
        if (sandboxId) fetch(API + "/replays?sandbox_id=" + encodeURIComponent(sandboxId), { credentials: "include" }).then((res) => res.json()).then((x) => x.success && x.data && setReplays(x.data));
      })
      .finally(() => setLoading(false));
  };

  const createReplaySession = () => {
    if (!sandboxId) return;
    setLoading(true);
    fetch(API + "/replays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sandbox_id: sandboxId, action: "replay_session", name: replayName || "Replay session" }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setReplayName("");
        if (sandboxId) fetch(API + "/replays?sandbox_id=" + encodeURIComponent(sandboxId), { credentials: "include" }).then((res) => res.json()).then((x) => x.success && x.data && setReplays(x.data));
      })
      .finally(() => setLoading(false));
  };

  const exportJson = () => {
    if (!session || !events.length) return;
    const payload = {
      replay_session: session,
      events,
      exported_at: new Date().toISOString(),
      label: "SANDBOX REPLAY EXPORT | READ-ONLY",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `replay-${session.name.replace(/\s+/g, "-")}-${session.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const affectedFromEvent = (e: ReplayEvent): string[] => {
    const ids: string[] = [];
    if (e.entity_id) ids.push(e.entity_id);
    if (e.after_state && typeof e.after_state === "object") {
      const a = e.after_state as Record<string, unknown>;
      if (a.user_id && typeof a.user_id === "string") ids.push(a.user_id);
      if (a.reviewed_user_id && typeof a.reviewed_user_id === "string") ids.push(a.reviewed_user_id);
    }
    return [...new Set(ids)];
  };

  const trustDelta = (e: ReplayEvent): number | null => {
    if (e.trust_score_before != null && e.trust_score_after != null) return e.trust_score_after - e.trust_score_before;
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">Sandbox session</label>
        <select value={sandboxId} onChange={(e) => setSandboxId(e.target.value)} className="rounded border border-slate-300 px-3 py-1.5 text-sm w-full max-w-xs">
          <option value="">Select session</option>
          {sessions.map((s) => <option key={s.id} value={s.id}>{s.name ?? s.id}</option>)}
        </select>
        <div className="mt-3 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Snapshot name</label>
            <input value={snapshotName} onChange={(e) => setSnapshotName(e.target.value)} placeholder="Optional" className="rounded border px-2 py-1.5 text-sm w-48" />
            <Button type="button" size="sm" className="ml-2" onClick={createSnapshot} disabled={loading}>Create snapshot</Button>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Replay session name</label>
            <input value={replayName} onChange={(e) => setReplayName(e.target.value)} placeholder="Optional" className="rounded border px-2 py-1.5 text-sm w-48" />
            <Button type="button" size="sm" className="ml-2" onClick={createReplaySession} disabled={loading}>Create replay session</Button>
          </div>
        </div>
      </div>

      {!selectedReplay && sandboxId && (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Replay sessions</h2>
          {loading ? <p className="text-sm text-slate-500">Loading…</p> : (
            <ul className="space-y-1">
              {replays.map((r) => (
                <li key={r.id} className="flex items-center gap-2">
                  <button type="button" className="text-sm text-blue-600 hover:underline" onClick={() => loadReplayDetail(r)}>{r.name}</button>
                  <span className="text-xs text-slate-500">{r.status}</span>
                </li>
              ))}
              {replays.length === 0 && <li className="text-sm text-slate-500">No replay sessions. Create one above.</li>}
            </ul>
          )}
        </div>
      )}

      {selectedReplay && session && (
        <>
          {/* Global banner: SANDBOX REPLAY MODE | READ-ONLY | RULE VERSION */}
          <div className="rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-2 flex flex-wrap items-center gap-4 text-sm font-medium text-amber-900">
            <span aria-label="Sandbox replay mode">SANDBOX REPLAY MODE</span>
            <span>|</span>
            <span>READ-ONLY</span>
            <span>|</span>
            <span>{ruleVersionLabel}</span>
            <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={exportJson}>Export JSON</Button>
            <Button type="button" variant="outline" size="sm" onClick={exportPdf}>Export PDF</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setSelectedReplay(null); setSession(null); setEvents([]); setSelectedEvent(null); }}>Back to list</Button>
          </div>

          {/* 3-panel forensic layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[480px]">
            {/* LEFT — Timeline */}
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden flex flex-col">
              <div className="px-3 py-2 border-b border-slate-200 font-semibold text-slate-900 bg-slate-50">Timeline</div>
              <div className="flex-1 overflow-y-auto p-2">
                {events.length === 0 ? (
                  <p className="text-sm text-slate-500 p-2">No events.</p>
                ) : (
                  events.map((e) => (
                    <button
                      type="button"
                      key={e.id}
                      onClick={() => setSelectedEvent(e)}
                      className={`w-full text-left rounded border px-2 py-2 mb-1 text-xs ${severityColor(e.event_type)} ${selectedEvent?.id === e.id ? "ring-2 ring-blue-400" : ""}`}
                    >
                      <span className="font-mono">#{e.event_order}</span>
                      <span className="ml-2 font-medium">{e.event_type}</span>
                      <span className="block mt-0.5 text-slate-500 truncate">{new Date(e.created_at).toISOString().slice(11, 19)}</span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* CENTER — Event detail */}
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden flex flex-col">
              <div className="px-3 py-2 border-b border-slate-200 font-semibold text-slate-900 bg-slate-50">Event detail</div>
              <div className="flex-1 overflow-y-auto p-3 text-sm">
                {!selectedEvent ? (
                  <p className="text-slate-500">Click an event in the timeline.</p>
                ) : (
                  <div className="space-y-3">
                    <p><span className="font-medium text-slate-600">Type:</span> {selectedEvent.event_type}</p>
                    <p><span className="font-medium text-slate-600">Trigger / entity:</span> {selectedEvent.entity_type ?? "—"} {selectedEvent.entity_id ? `(${selectedEvent.entity_id.slice(0, 8)}…)` : ""}</p>
                    <p><span className="font-medium text-slate-600">Rule version:</span> {selectedEvent.rule_version_id ?? "—"}</p>
                    <p><span className="font-medium text-slate-600">Trust score:</span> {selectedEvent.trust_score_before ?? "—"} → {selectedEvent.trust_score_after ?? "—"}</p>
                    <p><span className="font-medium text-slate-600">Reason:</span> {selectedEvent.reason ?? "—"}</p>
                    <p className="text-xs text-slate-500">Audit: event id {selectedEvent.id}. Replay is read-only; no mutation.</p>
                    {selectedEvent.before_state && Object.keys(selectedEvent.before_state).length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-slate-600">Before state</summary>
                        <pre className="mt-1 p-2 bg-slate-50 rounded text-xs overflow-auto max-h-32">{JSON.stringify(selectedEvent.before_state, null, 2)}</pre>
                      </details>
                    )}
                    {selectedEvent.after_state && Object.keys(selectedEvent.after_state).length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-slate-600">After state</summary>
                        <pre className="mt-1 p-2 bg-slate-50 rounded text-xs overflow-auto max-h-32">{JSON.stringify(selectedEvent.after_state, null, 2)}</pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — Impact analysis */}
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden flex flex-col">
              <div className="px-3 py-2 border-b border-slate-200 font-semibold text-slate-900 bg-slate-50">Impact analysis</div>
              <div className="flex-1 overflow-y-auto p-3 text-sm">
                {!selectedEvent ? (
                  <p className="text-slate-500">Select an event to see impact.</p>
                ) : (
                  <div className="space-y-3">
                    <p><span className="font-medium text-slate-600">Affected entities:</span></p>
                    <ul className="list-disc list-inside text-slate-600">
                      {affectedFromEvent(selectedEvent).length === 0 ? <li>—</li> : affectedFromEvent(selectedEvent).map((id) => <li key={id} className="font-mono text-xs">{id}</li>)}
                    </ul>
                    {trustDelta(selectedEvent) !== null && (
                      <p>
                        <span className="font-medium text-slate-600">Trust delta:</span>{" "}
                        <span className={trustDelta(selectedEvent)! >= 0 ? "text-emerald-600" : "text-red-600"}>
                          {trustDelta(selectedEvent)! >= 0 ? "+" : ""}{trustDelta(selectedEvent)}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-slate-500">Network/cluster context can be extended from snapshot data.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
