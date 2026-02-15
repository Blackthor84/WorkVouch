"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const SANDBOX_IMPERSONATION_KEY = "sandbox_playground_impersonation";

type SandboxSession = { id: string; name?: string; status?: string };
type SandboxEmployee = { id: string; full_name: string; industry?: string | null };
type SandboxEmployer = { id: string; company_name: string; industry?: string | null };
type IntelRow = {
  employee_id?: string;
  profile_strength?: number | null;
  career_health?: number | null;
  risk_index?: number | null;
  team_fit?: number | null;
  hiring_confidence?: number | null;
  network_density?: number | null;
};
type Impersonation = { type: "employee" | "employer"; id: string; name: string; sandboxId: string } | null;

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? res.statusText);
  }
  return res.json();
}

async function apiPost<T>(url: string, body: object): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error ?? res.statusText);
  }
  return res.json();
}

export function PlaygroundClient() {
  const [sessions, setSessions] = useState<SandboxSession[]>([]);
  const [selectedSandboxId, setSelectedSandboxId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<SandboxEmployee[]>([]);
  const [employers, setEmployers] = useState<SandboxEmployer[]>([]);
  const [intelOutputs, setIntelOutputs] = useState<IntelRow[]>([]);
  const [impersonation, setImpersonationState] = useState<Impersonation>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    const out = await apiGet<{ success: boolean; data: SandboxSession[] }>("/api/admin/sandbox-v2/sessions");
    if (out.success && Array.isArray(out.data)) {
      setSessions(out.data);
      if (out.data.length > 0 && !selectedSandboxId) setSelectedSandboxId(out.data[0].id);
    }
  }, [selectedSandboxId]);

  const loadDashboard = useCallback(async (sandboxId: string) => {
    const out = await apiGet<{
      success: boolean;
      data: {
        employees: SandboxEmployee[];
        employers: SandboxEmployer[];
        employeeIntelligence?: { outputs?: IntelRow[] };
      };
    }>(`/api/admin/sandbox-v2/dashboard?sandboxId=${encodeURIComponent(sandboxId)}`);
    if (out.success && out.data) {
      setEmployees(out.data.employees ?? []);
      setEmployers(out.data.employers ?? []);
      setIntelOutputs(out.data.employeeIntelligence?.outputs ?? []);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.sessionStorage?.getItem(SANDBOX_IMPERSONATION_KEY) : null;
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Impersonation;
        if (parsed && parsed.sandboxId && parsed.id) setImpersonationState(parsed);
      } catch {
        sessionStorage?.removeItem(SANDBOX_IMPERSONATION_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedSandboxId) {
      setLoading(true);
      setError(null);
      loadDashboard(selectedSandboxId).catch((e) => setError(e.message)).finally(() => setLoading(false));
    } else {
      setEmployees([]);
      setEmployers([]);
      setIntelOutputs([]);
      setLoading(false);
    }
  }, [selectedSandboxId, loadDashboard]);

  const runAction = useCallback(
    async (key: string, fn: () => Promise<unknown>) => {
      setActionLoading(key);
      setError(null);
      try {
        await fn();
        if (selectedSandboxId) await loadDashboard(selectedSandboxId);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setActionLoading(null);
      }
    },
    [selectedSandboxId, loadDashboard]
  );

  const spawnWorker = useCallback(() => runAction("worker", () => apiPost("/api/sandbox/spawn", { type: "worker", sandboxId: selectedSandboxId })), [selectedSandboxId, runAction]);
  const spawnEmployer = useCallback(() => runAction("employer", () => apiPost("/api/sandbox/spawn", { type: "employer", sandboxId: selectedSandboxId })), [selectedSandboxId, runAction]);
  const spawnCoworkerPair = useCallback(() => runAction("coworker", () => apiPost("/api/sandbox/spawn", { type: "pair", sandboxId: selectedSandboxId })), [selectedSandboxId, runAction]);
  const spawnEmployerAndTeam = useCallback(() => runAction("team", () => apiPost("/api/sandbox/spawn", { type: "team", sandboxId: selectedSandboxId })), [selectedSandboxId, runAction]);

  const [demoLoading, setDemoLoading] = useState(false);
  const runFullDemo = useCallback(async () => {
    if (!selectedSandboxId) {
      setError("Select a sandbox session first");
      return;
    }
    setDemoLoading(true);
    setError(null);
    try {
      await apiPost("/api/sandbox/run-demo", { sandboxId: selectedSandboxId });
      await loadDashboard(selectedSandboxId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setDemoLoading(false);
    }
  }, [selectedSandboxId, loadDashboard]);

  const setImpersonation = useCallback((value: Impersonation) => {
    setImpersonationState(value);
    if (typeof window !== "undefined") {
      if (value) window.sessionStorage?.setItem(SANDBOX_IMPERSONATION_KEY, JSON.stringify(value));
      else window.sessionStorage?.removeItem(SANDBOX_IMPERSONATION_KEY);
      window.dispatchEvent(new Event("sandbox-impersonation-change"));
    }
  }, []);

  const baseQuery = selectedSandboxId ? `?sandbox=${encodeURIComponent(selectedSandboxId)}` : "";

  return (
    <div className="space-y-6">
      {/* Top: session selector + Run Full Demo (top right) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm font-medium text-slate-700">Sandbox session</label>
          <select
            className="rounded border border-slate-300 px-2 py-1 text-sm"
            value={selectedSandboxId ?? ""}
            onChange={(e) => setSelectedSandboxId(e.target.value || null)}
          >
            <option value="">Select…</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name ?? s.id} {s.status ? `(${s.status})` : ""}
              </option>
            ))}
          </select>
        </div>
        <Button disabled={!selectedSandboxId || demoLoading} onClick={runFullDemo} className="shrink-0">
          {demoLoading ? "Running…" : "▶ Run Full Demo"}
        </Button>
      </div>

      {impersonation && (
        <div className="flex items-center justify-between rounded-lg border-2 border-amber-400 bg-amber-100 px-4 py-2 text-sm text-amber-900">
          <span className="font-medium">You are impersonating a sandbox user: {impersonation.name}</span>
          <Button variant="outline" size="sm" onClick={() => setImpersonation(null)}>
            Exit impersonation
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Layout Grid: Identity Simulator | Impersonation */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">🧬 Identity Simulator</h2>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!selectedSandboxId || !!actionLoading} onClick={spawnWorker}>
              {actionLoading === "worker" ? "Spawning…" : "Spawn Fake Worker"}
            </Button>
            <Button disabled={!selectedSandboxId || !!actionLoading} variant="secondary" onClick={spawnEmployer}>
              {actionLoading === "employer" ? "Spawning…" : "Spawn Fake Employer"}
            </Button>
            <Button disabled={!selectedSandboxId || !!actionLoading} variant="secondary" onClick={spawnCoworkerPair}>
              {actionLoading === "coworker" ? "Spawning…" : "Spawn Coworker Pair"}
            </Button>
            <Button disabled={!selectedSandboxId || !!actionLoading} variant="secondary" onClick={spawnEmployerAndTeam}>
              {actionLoading === "team" ? "Spawning…" : "Spawn Employer + Team"}
            </Button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">🎭 Impersonation</h2>
          <h3 className="text-sm font-medium text-slate-700 mb-2">Active Sandbox Users</h3>
          {loading ? (
            <p className="text-slate-500 text-sm">Loading…</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {employees.length === 0 && employers.length === 0 ? (
                <li className="text-slate-500">None yet. Spawn workers/employers first.</li>
              ) : (
                <>
                  {employees.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2">
                      <span>{e.full_name} (Worker)</span>
                      <Button variant="ghost" size="sm" onClick={() => selectedSandboxId && setImpersonation({ type: "employee", id: e.id, name: e.full_name, sandboxId: selectedSandboxId })}>
                        Impersonate
                      </Button>
                    </li>
                  ))}
                  {employers.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2">
                      <span>{e.company_name} (Employer)</span>
                      <Button variant="ghost" size="sm" onClick={() => selectedSandboxId && setImpersonation({ type: "employer", id: e.id, name: e.company_name, sandboxId: selectedSandboxId })}>
                        Impersonate
                      </Button>
                    </li>
                  ))}
                </>
              )}
            </ul>
          )}
          {impersonation && (
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={() => setImpersonation(null)}>Exit Impersonation</Button>
            </div>
          )}
        </section>
      </div>

      {/* Flow Triggers (REAL APP ACTIONS) */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">⚡ Flow Triggers (REAL APP ACTIONS)</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Worker:</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild><a href={`/dashboard${baseQuery}`}>Complete Profile</a></Button>
              <Button variant="outline" size="sm" asChild><a href={`/dashboard/worker/jobs${baseQuery}`}>Claim Job</a></Button>
              <Button variant="outline" size="sm" asChild><a href={`/coworker-matches${baseQuery}`}>Match Coworker</a></Button>
              <Button variant="outline" size="sm" asChild><a href={`/dashboard${baseQuery}`}>Leave Vouch</a></Button>
              <Button variant="outline" size="sm" asChild><a href={`/dashboard${baseQuery}`}>Submit Culture Traits</a></Button>
              <Button variant="outline" size="sm" asChild><a href={`/dashboard${baseQuery}`}>Flag Dispute</a></Button>
              <Button variant="outline" size="sm" asChild><a href={`/dashboard${baseQuery}`}>Request Rehire</a></Button>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Employer:</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild><a href={`/employer/listed-employees${baseQuery}`}>Confirm Coworker</a></Button>
              <Button variant="outline" size="sm" asChild><a href={`/employer/dashboard${baseQuery}`}>Review Vouch</a></Button>
              <Button variant="outline" size="sm" asChild><a href={`/employer/listed-employees${baseQuery}`}>Reject Vouch</a></Button>
              <Button variant="outline" size="sm" asChild><a href={`/employer/listed-employees${baseQuery}`}>Flag Fraud</a></Button>
            </div>
          </div>
        </div>
      </section>

      {/* Hidden Systems Observer (Read-Only) — 4-line readout */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">🧠 Hidden Systems Observer (Read-Only)</h2>
        {loading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : (
          <dl className="grid gap-2 text-sm">
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-slate-700 min-w-[180px]">Trust Score Δ:</dt>
              <dd className="text-slate-600">
                {intelOutputs.length > 0 && intelOutputs[0].hiring_confidence != null
                  ? `+${(Number(intelOutputs[0].hiring_confidence) * 0.1).toFixed(2)}`
                  : "—"}
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-slate-700 min-w-[180px]">Job Culture Traits:</dt>
              <dd className="text-slate-600">FAST_PACED (0.62), TEAM_BASED (0.51)</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-slate-700 min-w-[180px]">Peer Signals:</dt>
              <dd className="text-slate-600">LOW_FRICTION (0.44)</dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt className="font-medium text-slate-700 min-w-[180px]">Abuse Risk:</dt>
              <dd className="text-slate-600">
                {intelOutputs.length > 0 && intelOutputs[0].risk_index != null
                  ? Number(intelOutputs[0].risk_index) < 0.3
                    ? `LOW (${Number(intelOutputs[0].risk_index).toFixed(2)})`
                    : Number(intelOutputs[0].risk_index) < 0.6
                      ? `MEDIUM (${Number(intelOutputs[0].risk_index).toFixed(2)})`
                      : `HIGH (${Number(intelOutputs[0].risk_index).toFixed(2)})`
                  : "LOW (0.08)"}
              </dd>
            </div>
          </dl>
        )}
      </section>
    </div>
  );
}
