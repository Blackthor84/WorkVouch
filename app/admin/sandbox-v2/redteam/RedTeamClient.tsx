"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const API = "/api/admin/sandbox-v2";

const SCENARIOS = [
  { id: "sybil_attack", label: "Sybil attack" },
  { id: "collusion_ring", label: "Collusion ring" },
  { id: "fake_overlap_farm", label: "Fake overlap farm" },
  { id: "review_brigade", label: "Review brigade" },
  { id: "employer_collusion", label: "Employer collusion" },
];

type Session = { id: string; name: string | null };
type Run = {
  id: string;
  scenario: string;
  status: string;
  outcome: {
    scenario: string;
    detected: boolean;
    detection_latency_ms?: number;
    abuse_signals_created: number;
    alerts_triggered: number;
    incidents_triggered: number;
  } | null;
  created_at: string;
};

export function RedTeamClient() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sandboxId, setSandboxId] = useState("");
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(false);
  const [runLoading, setRunLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch(API + "/sessions", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => (d.success && d.data ? setSessions(d.data as Session[]) : []));
  }, []);

  useEffect(() => {
    if (!sandboxId) return;
    setLoading(true);
    fetch(API + "/redteam?sandbox_id=" + encodeURIComponent(sandboxId), { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setRuns(d.data as Run[]);
        else setRuns([]);
      })
      .finally(() => setLoading(false));
  }, [sandboxId]);

  const runScenario = (scenario: string) => {
    if (!sandboxId) return;
    setRunLoading(scenario);
    fetch(API + "/redteam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ sandbox_id: sandboxId, scenario }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && sandboxId) {
          fetch(API + "/redteam?sandbox_id=" + encodeURIComponent(sandboxId), { credentials: "include" })
            .then((res) => res.json())
            .then((x) => x.success && x.data && setRuns(x.data));
        }
      })
      .finally(() => setRunLoading(null));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">Sandbox session</label>
        <select value={sandboxId} onChange={(e) => setSandboxId(e.target.value)} className="rounded border border-slate-300 px-3 py-1.5 text-sm w-full max-w-xs">
          <option value="">Select session</option>
          {sessions.map((s) => <option key={s.id} value={s.id}>{s.name ?? s.id}</option>)}
        </select>
      </div>

      {sandboxId && (
        <>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Attack scenarios</h2>
            <p className="text-xs text-slate-500 mb-3">Run a scenario to generate abuse signals and record detection outcome.</p>
            <div className="flex flex-wrap gap-2">
              {SCENARIOS.map((s) => (
                <Button
                  key={s.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => runScenario(s.id)}
                  disabled={runLoading !== null}
                >
                  {runLoading === s.id ? "Running…" : s.label}
                </Button>
              ))}
            </div>
          </div>

          {runs.length > 0 && (() => {
            const dash = computeDashboard(runs);
            return (
              <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Dashboard — metrics &amp; recommendations</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div className="rounded border border-slate-200 p-3">
                    <p className="text-slate-500">Detection success rate</p>
                    <p className="font-semibold text-slate-900">{dash.total === 0 ? "—" : `${dash.detected}/${dash.total} (${dash.resilienceScore ?? 0}%)`}</p>
                  </div>
                  <div className="rounded border border-slate-200 p-3">
                    <p className="text-slate-500">Avg detection latency</p>
                    <p className="font-semibold text-slate-900">{dash.avgLatency != null ? `${dash.avgLatency} ms` : "—"}</p>
                  </div>
                  <div className="rounded border border-slate-200 p-3">
                    <p className="text-slate-500">System resilience score</p>
                    <p className="font-semibold text-slate-900">{dash.resilienceScore != null ? `${dash.resilienceScore}%` : "—"}</p>
                  </div>
                  <div className="rounded border border-slate-200 p-3">
                    <p className="text-slate-500">Runs</p>
                    <p className="font-semibold text-slate-900">{runs.length}</p>
                  </div>
                </div>
                {dash.weakPoints.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-1">Weak points identified</h3>
                    <ul className="list-disc list-inside text-sm text-amber-800">{dash.weakPoints.map((w) => <li key={w}>{w}</li>)}</ul>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-1">Recommendations</h3>
                  <ul className="list-disc list-inside text-sm text-slate-600">{dash.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
              </div>
            );
          })()}

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Detection outcomes</h2>
            {loading ? <p className="text-sm text-slate-500">Loading…</p> : (
              <ul className="space-y-2 text-sm">
                {runs.map((r) => (
                  <li key={r.id} className="flex gap-4 items-start border-b border-slate-100 pb-2">
                    <span className="font-medium w-40">{r.scenario}</span>
                    <span>{r.status}</span>
                    {r.outcome && (
                      <>
                        <span className={r.outcome.detected ? "text-emerald-600" : "text-slate-500"}>
                          {r.outcome.detected ? "Detected" : "Not detected"}
                        </span>
                        <span>Signals: {r.outcome.abuse_signals_created}</span>
                        {r.outcome.detection_latency_ms != null && <span>{r.outcome.detection_latency_ms}ms</span>}
                      </>
                    )}
                    <span className="text-slate-400">{new Date(r.created_at).toISOString().slice(0, 19)}</span>
                  </li>
                ))}
                {!loading && runs.length === 0 && <li className="text-slate-500">No runs yet.</li>}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
