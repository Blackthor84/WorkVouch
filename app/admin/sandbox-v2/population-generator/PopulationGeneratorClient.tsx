"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const API = "/api/admin/sandbox-v2";

type Session = { id: string; name: string | null };
type Pop = { id: string; name: string | null; user_count: number; employer_count: number; created_at: string };

export function PopulationGeneratorClient() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sandboxId, setSandboxId] = useState("");
  const [userCount, setUserCount] = useState(100);
  const [employerCount, setEmployerCount] = useState(10);
  const [overlapDensity, setOverlapDensity] = useState(0.3);
  const [pctMalicious, setPctMalicious] = useState(0);
  const [pctCollusionClusters, setPctCollusionClusters] = useState(0);
  const [reviewBehavior, setReviewBehavior] = useState<"normal" | "sparse" | "brigade">("normal");
  const [populations, setPopulations] = useState<Pop[]>([]);
  const [lastSummary, setLastSummary] = useState<{ user_count: number; employer_count: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    fetch(API + "/sessions", { credentials: "include" }).then((r) => r.json()).then((d) => (d.success && d.data ? setSessions(d.data) : []));
  }, []);

  useEffect(() => {
    if (!sandboxId) return;
    setLoading(true);
    fetch(API + "/synthetic-population?sandbox_id=" + encodeURIComponent(sandboxId), { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { if (d.success && d.data) setPopulations(d.data); else setPopulations([]); })
      .finally(() => setLoading(false));
  }, [sandboxId]);

  const generate = () => {
    if (!sandboxId) return;
    setGenLoading(true);
    fetch(API + "/synthetic-population", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        sandbox_id: sandboxId,
        user_count: userCount,
        employer_count: employerCount,
        overlap_density: overlapDensity,
        pct_malicious: pctMalicious,
        pct_collusion_clusters: pctCollusionClusters,
        review_behavior: reviewBehavior,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && sandboxId) {
          setLastSummary(d.user_count != null ? { user_count: d.user_count, employer_count: d.employer_count ?? 0 } : null);
          fetch(API + "/synthetic-population?sandbox_id=" + encodeURIComponent(sandboxId), { credentials: "include" })
            .then((res) => res.json())
            .then((x) => x.success && x.data && setPopulations(x.data));
        }
      })
      .finally(() => setGenLoading(false));
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
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Parameters</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Users (1-5000)</label>
                <input type="number" min={1} max={5000} value={userCount} onChange={(e) => setUserCount(Number(e.target.value) || 1)} className="rounded border px-2 py-1.5 text-sm w-24" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Employers (1-500)</label>
                <input type="number" min={1} max={500} value={employerCount} onChange={(e) => setEmployerCount(Number(e.target.value) || 1)} className="rounded border px-2 py-1.5 text-sm w-24" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Overlap density (0-1)</label>
                <input type="range" min={0} max={1} step={0.1} value={overlapDensity} onChange={(e) => setOverlapDensity(Number(e.target.value))} className="w-32" />
                <span className="ml-2 text-sm text-slate-600">{overlapDensity}</span>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">% malicious (0-100)</label>
                <input type="range" min={0} max={100} value={pctMalicious} onChange={(e) => setPctMalicious(Number(e.target.value))} className="w-32" />
                <span className="ml-2 text-sm text-slate-600">{pctMalicious}%</span>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">% collusion clusters (0-100)</label>
                <input type="range" min={0} max={100} value={pctCollusionClusters} onChange={(e) => setPctCollusionClusters(Number(e.target.value))} className="w-32" />
                <span className="ml-2 text-sm text-slate-600">{pctCollusionClusters}%</span>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Review behavior</label>
                <select value={reviewBehavior} onChange={(e) => setReviewBehavior(e.target.value as "normal" | "sparse" | "brigade")} className="rounded border px-2 py-1.5 text-sm">
                  <option value="normal">Normal</option>
                  <option value="sparse">Sparse</option>
                  <option value="brigade">Brigade</option>
                </select>
              </div>
            </div>
            <Button type="button" className="mt-4" onClick={generate} disabled={genLoading}>Generate and Simulate</Button>
            {lastSummary && <p className="mt-2 text-sm text-slate-600">Last run: {lastSummary.user_count} users, {lastSummary.employer_count} employers.</p>}
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Generated populations</h2>
            {loading ? <p className="text-sm text-slate-500">Loading...</p> : (
              <ul className="space-y-1 text-sm">
                {populations.map((p) => (
                  <li key={p.id}>{p.name ?? p.id} - {p.user_count} users, {p.employer_count} employers</li>
                ))}
                {!loading && populations.length === 0 && <li className="text-slate-500">None yet.</li>}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
