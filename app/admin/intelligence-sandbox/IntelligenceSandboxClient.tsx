"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EnterpriseSandboxSection } from "./EnterpriseSandboxSection";

type EmployerItem = { id: string; company_name?: string };

type SandboxSession = {
  id: string;
  industry: string;
  sub_industry?: string;
  role_title?: string;
  employer_id?: string;
  candidate_count: number;
  mode?: string;
  expires_at: string;
  created_at: string;
};

type SandboxData = {
  session: SandboxSession;
  profiles: { id: string; industry: string; role_title?: string }[];
  vectors: Record<string, unknown>[];
  industryBaselines: Record<string, unknown>[];
  employerBaselines: Record<string, unknown>[];
  teamFitScores: { profile_id: string; alignment_score: number; breakdown?: unknown }[];
  riskOutputs: { profile_id: string; overall_score: number; breakdown?: unknown }[];
  hiringConfidenceScores: { profile_id: string; composite_score: number; breakdown?: unknown }[];
  baselineSnapshots?: { baseline_before: unknown; baseline_after: unknown; delta_percent: Record<string, number> }[];
  driftWarning?: boolean;
};

const INDUSTRIES = ["corporate", "security", "healthcare", "logistics", "retail", "hospitality", "technology"];
const SANDBOX_TTL_MINUTES = 10;
const MAX_STRESS_CANDIDATES = 10000;

export function IntelligenceSandboxClient({
  employerList,
  onSandboxCreated,
  onSandboxDataChange,
}: {
  employerList: EmployerItem[];
  onSandboxCreated?: (id: string) => void;
  onSandboxDataChange?: () => void;
}) {
  const [mainTab, setMainTab] = useState<"legacy" | "enterprise">("enterprise");
  const [tab, setTab] = useState<"standard" | "stress">("standard");
  const [sessionId, setSessionId] = useState("");
  const [industry, setIndustry] = useState("security");
  const [subIndustry, setSubIndustry] = useState("");
  const [roleTitle, setRoleTitle] = useState("Supervisor");
  const [employerId, setEmployerId] = useState("");
  const [candidateCount, setCandidateCount] = useState(10);
  const [presetReliability, setPresetReliability] = useState(70);
  const [presetStructure, setPresetStructure] = useState(65);
  const [presetCommunication, setPresetCommunication] = useState(60);
  const [stabilityVariance, setStabilityVariance] = useState(10);
  const [pressureVariance, setPressureVariance] = useState(10);
  const [integrityVariance, setIntegrityVariance] = useState(10);
  const [leadershipVariance, setLeadershipVariance] = useState(10);
  const [roleWeightPct, setRoleWeightPct] = useState(25);
  const [subIndustryWeightPct, setSubIndustryWeightPct] = useState(25);
  const [industryWeightPct, setIndustryWeightPct] = useState(25);
  const [employerWeightPct, setEmployerWeightPct] = useState(25);
  const [data, setData] = useState<SandboxData | null>(null);
  const [loading, setLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");
  const [lastCreateResult, setLastCreateResult] = useState<{
    executionTimeMs?: number;
    dbWriteTimeMs?: number;
    driftWarning?: boolean;
    baselineSnapshot?: { baseline_before: Record<string, number>; baseline_after: Record<string, number>; delta_percent: Record<string, number> };
  } | null>(null);
  const [hybridPreview, setHybridPreview] = useState<{ blendedBaseline: unknown; sampleAlignmentScores: number[] } | null>(null);

  useEffect(() => {
    if (!expiresAt) {
      setCountdown("");
      return;
    }
    const tick = () => {
      const left = new Date(expiresAt).getTime() - Date.now();
      if (left <= 0) {
        setCountdown("Expired");
        setData(null);
        setSessionId("");
        setExpiresAt(null);
        setLastCreateResult(null);
        return;
      }
      const m = Math.floor(left / 60000);
      const s = Math.floor((left % 60000) / 1000);
      setCountdown(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  async function createSession() {
    setLoading(true);
    setError(null);
    setLastCreateResult(null);
    try {
      const body: Record<string, unknown> = {
        industry,
        subIndustry: subIndustry || undefined,
        roleTitle: roleTitle || undefined,
        employerId: employerId || undefined,
        candidateCount: tab === "stress" ? Math.min(candidateCount, MAX_STRESS_CANDIDATES) : Math.min(candidateCount, 500),
        behavioralPreset: {
          avg_reliability: presetReliability,
          avg_structure: presetStructure,
          avg_communication: presetCommunication,
        },
        mode: tab,
      };
      if (tab === "stress") {
        body.variationProfile = {
          stabilityVariance,
          pressureVariance,
          integrityVariance,
          leadershipVariance,
        };
        body.fraudClusterSimulation = false;
      }
      const res = await fetch("/api/admin/intelligence-sandbox/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Create failed");
        return;
      }
      const j = await res.json();
      setSessionId(j.sandboxSessionId);
      setExpiresAt(j.expiresAt);
      setLastCreateResult({
        executionTimeMs: j.executionTimeMs,
        dbWriteTimeMs: j.dbWriteTimeMs,
        driftWarning: j.driftWarning,
        baselineSnapshot: j.baselineSnapshot,
      });
      await loadSession(j.sandboxSessionId);
    } catch (e) {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function createFraudCluster() {
    setLoading(true);
    setError(null);
    setLastCreateResult(null);
    try {
      const res = await fetch("/api/admin/intelligence-sandbox/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          industry: "security",
          roleTitle: "Guard",
          employerId: employerId || undefined,
          candidateCount: tab === "stress" ? Math.min(500, candidateCount) : 50,
          mode: tab,
          fraudClusterSimulation: true,
          variationProfile: { stabilityVariance: 40, pressureVariance: 30, integrityVariance: 50, leadershipVariance: 20 },
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Create failed");
        return;
      }
      const j = await res.json();
      setSessionId(j.sandboxSessionId);
      setExpiresAt(j.expiresAt);
      setLastCreateResult({ executionTimeMs: j.executionTimeMs, dbWriteTimeMs: j.dbWriteTimeMs, driftWarning: j.driftWarning, baselineSnapshot: j.baselineSnapshot });
      await loadSession(j.sandboxSessionId);
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadSession(id: string) {
    try {
      const res = await fetch(`/api/admin/intelligence-sandbox?sessionId=${encodeURIComponent(id)}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 410 || res.status === 404) {
          setData(null);
          setSessionId("");
          setExpiresAt(null);
          setLastCreateResult(null);
        }
        return;
      }
      const j = await res.json();
      setData(j);
      setExpiresAt(j.session?.expires_at ?? null);
    } catch {
      setData(null);
    }
  }

  async function runScoring() {
    if (!sessionId) return;
    setRunLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/intelligence-sandbox/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId, employerId: employerId || null }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Run failed");
        return;
      }
      await loadSession(sessionId);
    } catch {
      setError("Run failed");
    } finally {
      setRunLoading(false);
    }
  }

  async function refreshHybridPreview() {
    if (!sessionId) return;
    const total = roleWeightPct + subIndustryWeightPct + industryWeightPct + employerWeightPct;
    const scale = total > 0 ? 100 / total : 1;
    try {
      const res = await fetch("/api/admin/intelligence-sandbox/hybrid-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          employerId: employerId || null,
          roleWeightPct: roleWeightPct * scale,
          subIndustryWeightPct: subIndustryWeightPct * scale,
          industryWeightPct: industryWeightPct * scale,
          employerWeightPct: employerWeightPct * scale,
        }),
      });
      if (!res.ok) return;
      const j = await res.json();
      setHybridPreview({ blendedBaseline: j.blendedBaseline, sampleAlignmentScores: j.sampleAlignmentScores ?? [] });
    } catch {
      setHybridPreview(null);
    }
  }

  useEffect(() => {
    if (sessionId && data?.session?.expires_at && new Date(data.session.expires_at) > new Date()) {
      const t = setInterval(() => loadSession(sessionId), 15000);
      return () => clearInterval(t);
    }
  }, [sessionId, data?.session?.expires_at]);

  const driftWarning = data?.driftWarning ?? lastCreateResult?.driftWarning ?? false;
  const snapshot = lastCreateResult?.baselineSnapshot ?? data?.baselineSnapshots?.[0];
  const totalWeight = roleWeightPct + subIndustryWeightPct + industryWeightPct + employerWeightPct;
  const weightValid = Math.abs(totalWeight - 100) < 1;

  if (mainTab === "enterprise") {
    return (
      <div className="space-y-6">
        <div className="flex gap-2 border-b border-grey-background dark:border-[#374151] pb-2">
          <button
            type="button"
            onClick={() => setMainTab("enterprise")}
            className="px-4 py-2 rounded-t font-medium bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/50"
          >
            Enterprise Sandbox
          </button>
          <button
            type="button"
            onClick={() => setMainTab("legacy")}
            className="px-4 py-2 rounded-t font-medium text-grey-medium dark:text-gray-400 hover:text-grey-dark dark:hover:text-gray-200"
          >
            Legacy Simulation
          </button>
        </div>
        <EnterpriseSandboxSection employerList={employerList} onSandboxCreated={onSandboxCreated} onSandboxDataChange={onSandboxDataChange} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-grey-background dark:border-[#374151] pb-2">
        <button
          type="button"
          onClick={() => setMainTab("enterprise")}
          className="px-4 py-2 rounded-t font-medium text-grey-medium dark:text-gray-400 hover:text-grey-dark dark:hover:text-gray-200"
        >
          Enterprise Sandbox
        </button>
        <button
          type="button"
          onClick={() => setTab("standard")}
          className={`px-4 py-2 rounded-t font-medium ${tab === "standard" ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/50" : "text-grey-medium dark:text-gray-400"}`}
        >
          Standard
        </button>
        <button
          type="button"
          onClick={() => setTab("stress")}
          className={`px-4 py-2 rounded-t font-medium ${tab === "stress" ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/50" : "text-grey-medium dark:text-gray-400"}`}
        >
          Stress Mode
        </button>
      </div>

      {tab === "stress" && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3">
          <span className="font-medium text-amber-700 dark:text-amber-400">
            Stress Simulation — No production impact. Data auto-deletes in {SANDBOX_TTL_MINUTES} minutes.
          </span>
          {expiresAt && <span className="tabular-nums text-amber-800 dark:text-amber-300 ml-2">{countdown || "—"} left</span>}
        </div>
      )}

      {driftWarning && (
        <div className="rounded-lg border-2 border-red-500 bg-red-500/15 px-4 py-3 flex items-center gap-2">
          <span className="font-semibold text-red-700 dark:text-red-400">Model Drift Warning</span>
          <span className="text-red-600 dark:text-red-300 text-sm">Baseline shift &gt; 20% in at least one dimension. Admin visibility only.</span>
        </div>
      )}

      {tab !== "stress" && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 flex items-center justify-between">
          <span className="font-medium text-amber-700 dark:text-amber-400">
            Sandbox Mode — Data auto-deletes in {SANDBOX_TTL_MINUTES} minutes
          </span>
          {expiresAt && <span className="tabular-nums text-amber-800 dark:text-amber-300">{countdown || "—"} left</span>}
        </div>
      )}

      {tab === "standard" && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-3 flex items-center justify-between">
          <span className="font-medium text-amber-700 dark:text-amber-400">
            Sandbox Mode — Data auto-deletes in {SANDBOX_TTL_MINUTES} minutes
          </span>
          {expiresAt && <span className="tabular-nums text-amber-800 dark:text-amber-300">{countdown || "—"} left</span>}
        </div>
      )}

      {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{tab === "stress" ? "Volume Generator" : "Create Simulation"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-1">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
              >
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-1">Sub-industry</label>
              <input
                type="text"
                value={subIndustry}
                onChange={(e) => setSubIndustry(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-1">Role</label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Supervisor"
                className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-1">Employer</label>
              <select
                value={employerId}
                onChange={(e) => setEmployerId(e.target.value)}
                className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
              >
                <option value="">None</option>
                {employerList.map((e) => (
                  <option key={e.id} value={e.id}>{e.company_name || e.id.slice(0, 8)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-1">Candidates (max {tab === "stress" ? MAX_STRESS_CANDIDATES : 500})</label>
              <input
                type="number"
                min={1}
                max={tab === "stress" ? MAX_STRESS_CANDIDATES : 500}
                value={candidateCount}
                onChange={(e) => setCandidateCount(parseInt(e.target.value, 10) || 10)}
                className="w-full rounded-lg border border-grey-background dark:border-[#374151] bg-white dark:bg-[#111827] px-3 py-2 text-grey-dark dark:text-gray-200"
              />
            </div>
            {tab === "stress" && (
              <>
                <p className="font-medium text-grey-dark dark:text-gray-200">Variation Controls</p>
                <div>
                  <label className="block text-sm text-grey-medium dark:text-gray-400 mb-1">Stability variance</label>
                  <input type="range" min={0} max={50} value={stabilityVariance} onChange={(e) => setStabilityVariance(parseInt(e.target.value, 10))} className="w-full" />
                  <span className="text-sm">{stabilityVariance}</span>
                </div>
                <div>
                  <label className="block text-sm text-grey-medium dark:text-gray-400 mb-1">Pressure variance</label>
                  <input type="range" min={0} max={50} value={pressureVariance} onChange={(e) => setPressureVariance(parseInt(e.target.value, 10))} className="w-full" />
                  <span className="text-sm">{pressureVariance}</span>
                </div>
                <div>
                  <label className="block text-sm text-grey-medium dark:text-gray-400 mb-1">Integrity variance</label>
                  <input type="range" min={0} max={50} value={integrityVariance} onChange={(e) => setIntegrityVariance(parseInt(e.target.value, 10))} className="w-full" />
                  <span className="text-sm">{integrityVariance}</span>
                </div>
                <div>
                  <label className="block text-sm text-grey-medium dark:text-gray-400 mb-1">Leadership variance</label>
                  <input type="range" min={0} max={50} value={leadershipVariance} onChange={(e) => setLeadershipVariance(parseInt(e.target.value, 10))} className="w-full" />
                  <span className="text-sm">{leadershipVariance}</span>
                </div>
                <Button variant="secondary" onClick={createFraudCluster} disabled={loading}>
                  Fraud Cluster Simulation
                </Button>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-1">Preset: Reliability</label>
              <input type="range" min={0} max={100} value={presetReliability} onChange={(e) => setPresetReliability(parseInt(e.target.value, 10))} className="w-full" />
              <span className="text-sm text-grey-medium dark:text-gray-400">{presetReliability}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-1">Preset: Structure</label>
              <input type="range" min={0} max={100} value={presetStructure} onChange={(e) => setPresetStructure(parseInt(e.target.value, 10))} className="w-full" />
              <span className="text-sm text-grey-medium dark:text-gray-400">{presetStructure}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-grey-dark dark:text-gray-200 mb-1">Preset: Communication</label>
              <input type="range" min={0} max={100} value={presetCommunication} onChange={(e) => setPresetCommunication(parseInt(e.target.value, 10))} className="w-full" />
              <span className="text-sm text-grey-medium dark:text-gray-400">{presetCommunication}</span>
            </div>
            <Button onClick={createSession} disabled={loading}>
              {loading ? "Creating…" : "Create session"}
            </Button>
            {sessionId && (
              <Button variant="secondary" onClick={() => runScoring()} disabled={runLoading}>
                {runLoading ? "Running…" : "Run scoring"}
              </Button>
            )}
            {lastCreateResult?.executionTimeMs != null && (
              <p className="text-sm text-grey-medium dark:text-gray-400">
                Simulation completed in {lastCreateResult.executionTimeMs} ms
                {lastCreateResult.dbWriteTimeMs != null && ` (DB write: ${lastCreateResult.dbWriteTimeMs} ms)`}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{tab === "stress" ? "Weight Controls & Blended baseline" : "Blended baseline & alignment"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {tab === "stress" && sessionId && (
              <>
                <p className="font-medium text-grey-dark dark:text-gray-200">Weight % (total 100%)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs">Role</label>
                    <input type="number" min={0} max={100} value={roleWeightPct} onChange={(e) => setRoleWeightPct(parseInt(e.target.value, 10) || 0)} className="w-full rounded border px-2 py-1" />
                  </div>
                  <div>
                    <label className="block text-xs">Sub-industry</label>
                    <input type="number" min={0} max={100} value={subIndustryWeightPct} onChange={(e) => setSubIndustryWeightPct(parseInt(e.target.value, 10) || 0)} className="w-full rounded border px-2 py-1" />
                  </div>
                  <div>
                    <label className="block text-xs">Industry</label>
                    <input type="number" min={0} max={100} value={industryWeightPct} onChange={(e) => setIndustryWeightPct(parseInt(e.target.value, 10) || 0)} className="w-full rounded border px-2 py-1" />
                  </div>
                  <div>
                    <label className="block text-xs">Employer</label>
                    <input type="number" min={0} max={100} value={employerWeightPct} onChange={(e) => setEmployerWeightPct(parseInt(e.target.value, 10) || 0)} className="w-full rounded border px-2 py-1" />
                  </div>
                </div>
                <p className="text-xs text-grey-medium dark:text-gray-400">Total: {totalWeight}% {!weightValid && "(will normalize to 100%)"}</p>
                <Button variant="secondary" size="sm" onClick={() => refreshHybridPreview()} disabled={!sessionId}>
                  Recalculate hybrid (live)
                </Button>
                {hybridPreview && (
                  <>
                    <p className="font-medium text-grey-dark dark:text-gray-200 mt-2">Blended baseline (preview)</p>
                    <pre className="text-xs overflow-auto max-h-[120px] bg-slate-100 dark:bg-slate-800 p-2 rounded">{JSON.stringify(hybridPreview.blendedBaseline, null, 2)}</pre>
                    <p>Sample alignment: {hybridPreview.sampleAlignmentScores.join(", ")}</p>
                  </>
                )}
              </>
            )}
            {data && (
              <>
                {data.industryBaselines?.length > 0 && (
                  <div>
                    <p className="font-medium text-grey-dark dark:text-gray-200 mb-1">Industry baseline</p>
                    <pre className="text-xs overflow-auto max-h-[120px] bg-slate-100 dark:bg-slate-800 p-2 rounded">{JSON.stringify(data.industryBaselines[0], null, 2)}</pre>
                  </div>
                )}
                {data.employerBaselines?.length > 0 && (
                  <div>
                    <p className="font-medium text-grey-dark dark:text-gray-200 mb-1">Employer baseline</p>
                    <pre className="text-xs overflow-auto max-h-[120px] bg-slate-100 dark:bg-slate-800 p-2 rounded">{JSON.stringify(data.employerBaselines[0], null, 2)}</pre>
                  </div>
                )}
                {data.teamFitScores?.length > 0 && (
                  <p>Alignment scores (sample): {data.teamFitScores.slice(0, 5).map((t) => t.alignment_score).join(", ")}…</p>
                )}
                {data.vectors?.length > 0 && <p className="text-grey-medium dark:text-gray-400">{data.vectors.length} candidate vectors.</p>}
              </>
            )}
            {!data && !hybridPreview && <p className="text-grey-medium dark:text-gray-400">Create a session to see baselines and alignment.</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{tab === "stress" ? "Baseline Drift & Risk" : "Risk & hiring confidence"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {tab === "stress" && snapshot?.delta_percent && typeof snapshot.delta_percent === "object" && (
              <div>
                <p className="font-medium text-grey-dark dark:text-gray-200 mb-1">Baseline Drift (Δ %)</p>
                <ul className="list-disc list-inside text-xs">
                  {Object.entries(snapshot.delta_percent as Record<string, number>).map(([k, v]) => (
                    <li key={k}>Δ {k}: {v}%</li>
                  ))}
                </ul>
              </div>
            )}
            {(data?.riskOutputs?.length ?? 0) > 0 && (
              <p>Risk scores (sample): {(data?.riskOutputs?.slice(0, 5) ?? []).map((r) => r.overall_score).join(", ")}…</p>
            )}
            {(data?.hiringConfidenceScores?.length ?? 0) > 0 && (
              <p>Hiring confidence (sample): {(data?.hiringConfidenceScores?.slice(0, 5) ?? []).map((h) => h.composite_score).join(", ")}…</p>
            )}
            {((data?.riskOutputs?.length ?? 0) === 0 && (data?.hiringConfidenceScores?.length ?? 0) === 0) && sessionId && (
              <p className="text-grey-medium dark:text-gray-400">Click &quot;Run scoring&quot; to populate risk and hiring confidence.</p>
            )}
            {!sessionId && <p className="text-grey-medium dark:text-gray-400">Create a session and run scoring.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
