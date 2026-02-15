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
type ReportRow = {
  id: string;
  scenario: string;
  status: string;
  report: {
    scenario: string;
    detection_latency_ms: number;
    trust_inflation_before_containment: number;
    pct_auto_mitigated: number;
    manual_intervention_count: number;
    abuse_signals_created: number;
    completed_at: string;
  } | null;
  created_at: string;
};

export function PlaybookClient() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sandboxId, setSandboxId] = useState("");
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [selectedScenario, setSelectedScenario] = useState("");
  const [scale, setScale] = useState(1);
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [runLoading, setRunLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(API + "/sessions", { credentials: "include" }).then((r) => r.json()).then((d) => (d.success && d.data ? setSessions(d.data) : []));
  }, []);

  useEffect(() => {
    if (!sandboxId) return;
    setLoading(true);
    fetch(API + "/playbook?sandbox_id=" + encodeURIComponent(sandboxId), { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setReports(d.data); else setReports([]); })
      .finally(() => setLoading(false));
  }, [sandboxId]);

  const runPlaybook = () => {
    if (!sandboxId || !selectedScenario) return;
    setRunLoading(true);
    fetch(API + "/playbook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        sandbox_id: sandboxId,
        scenario: selectedScenario,
        config: { scale, duration_seconds: durationSeconds },
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && sandboxId) {
          fetch(API + "/playbook?sandbox_id=" + encodeURIComponent(sandboxId), { credentials: "include" }).then((res) => res.json()).then((x) => x.success && x.data && setReports(x.data));
        }
      })
      .finally(() => setRunLoading(false));
  };

  const exportReport = (r: ReportRow) => {
    fetch(API + "/playbook/" + r.id, { credentials: "include" })
      .then((res) => res.json())
      .then((d) => {
        if (!d.success || !d.report) return;
        const blob = new Blob([JSON.stringify(d.report, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "stress-test-report-" + r.scenario + "-" + r.id.slice(0, 8) + ".json";
        a.click();
        URL.revokeObjectURL(a.href);
      });
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
            <h2 className="text-lg font-semibold text-slate-900 mb-2">1. Select scenario</h2>
            <select value={selectedScenario} onChange={(e) => setSelectedScenario(e.target.value)} className="rounded border px-2 py-1.5 text-sm w-48">
              <option value="">—</option>
              {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">2. Configure scale and duration</h2>
            <div className="flex flex-wrap gap-6 items-center">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Scale (1-10)</label>
                <input type="number" min={1} max={10} value={scale} onChange={(e) => setScale(Number(e.target.value) || 1)} className="rounded border px-2 py-1.5 text-sm w-20" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Duration (seconds)</label>
                <input type="number" min={1} value={durationSeconds} onChange={(e) => setDurationSeconds(Number(e.target.value) || 60)} className="rounded border px-2 py-1.5 text-sm w-24" />
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">3. Run simulation</h2>
            <Button type="button" onClick={runPlaybook} disabled={runLoading || !selectedScenario}>Run playbook</Button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Reports (exportable)</h2>
            {loading ? <p className="text-sm text-slate-500">Loading...</p> : (
              <ul className="space-y-2 text-sm">
                {reports.map((r) => (
                  <li key={r.id} className="flex flex-wrap gap-2 items-center border-b border-slate-100 pb-2">
                    <span className="font-medium">{r.scenario}</span>
                    <span>{r.status}</span>
                    {r.report && (
                      <>
                        <span>Latency: {r.report.detection_latency_ms}ms</span>
                        <span>Auto-mitigated: {r.report.pct_auto_mitigated}%</span>
                        <span>Signals: {r.report.abuse_signals_created}</span>
                      </>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={() => exportReport(r)}>Export JSON</Button>
                  </li>
                ))}
                {!loading && reports.length === 0 && <li className="text-slate-500">No reports yet.</li>}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
