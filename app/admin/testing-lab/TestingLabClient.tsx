"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type SimSession = {
  id: string;
  created_at: string;
  start_at?: string;
  expires_at: string;
  is_active: boolean;
  auto_delete?: boolean;
  status?: string;
};
type Persona = { id: string; full_name?: string; email?: string; company_name?: string; plan_tier?: string };

function deriveStatus(s: SimSession): "scheduled" | "running" | "expired" | "deleted" {
  const st = s.status as string | undefined;
  if (st === "deleted" || st === "expired") return st as "deleted" | "expired";
  const now = Date.now();
  const end = new Date(s.expires_at).getTime();
  if (end <= now) return "expired";
  const start = s.start_at ? new Date(s.start_at).getTime() : new Date(s.created_at).getTime();
  if (start > now) return "scheduled";
  return "running";
}

function formatCountdown(expiresAt: string): string {
  const left = new Date(expiresAt).getTime() - Date.now();
  if (left <= 0) return "Expired";
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatStartsIn(startAt: string): string {
  const left = new Date(startAt).getTime() - Date.now();
  if (left <= 0) return "Starting";
  const m = Math.floor(left / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return `Starts in ${m}:${s.toString().padStart(2, "0")}`;
}

function SessionCreateForm({
  startSession,
  loading,
}: {
  startSession: (opts: { durationMinutes?: number; startAt?: string; endAt?: string; autoDelete?: boolean }) => Promise<void>;
  loading: boolean;
}) {
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [autoDelete, setAutoDelete] = useState(true);
  const [useSchedule, setUseSchedule] = useState(false);
  const handleQuick = (mins: number) => {
    startSession({ durationMinutes: mins, autoDelete: true });
  };
  const handleScheduled = () => {
    const startIso = startAt ? new Date(startAt).toISOString() : undefined;
    const endIso = endAt ? new Date(endAt).toISOString() : undefined;
    if (startIso && endIso) {
      startSession({ startAt: startIso, endAt: endIso, autoDelete });
    } else if (startIso) {
      startSession({ startAt: startIso, durationMinutes, autoDelete });
    } else {
      startSession({ durationMinutes, autoDelete });
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => handleQuick(60)} disabled={loading}>
          Start 60 min
        </Button>
        <Button size="sm" variant="secondary" onClick={() => handleQuick(30)} disabled={loading}>
          Start 30 min
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setUseSchedule((v) => !v)} disabled={loading}>
          {useSchedule ? "Hide schedule" : "Schedule start/end"}
        </Button>
      </div>
      {useSchedule && (
        <div className="grid gap-2 rounded border border-gray-600 bg-gray-900/50 p-3 text-sm">
          <div className="flex items-center gap-2">
            <Label className="min-w-[100px] text-gray-400">Start</Label>
            <Input
              type="datetime-local"
              className="max-w-[220px] bg-gray-800"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="min-w-[100px] text-gray-400">End</Label>
            <Input
              type="datetime-local"
              className="max-w-[220px] bg-gray-800"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="min-w-[100px] text-gray-400">Duration (min)</Label>
            <Input type="number" min={5} max={120} className="max-w-[80px] bg-gray-800" value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value) || 60)} />
          </div>
          <div className="flex items-center gap-2">
            <Label className="min-w-[100px] text-gray-400">Auto-delete</Label>
            <input type="checkbox" checked={autoDelete} onChange={(e) => setAutoDelete(e.target.checked)} className="rounded" />
          </div>
          <Button size="sm" onClick={handleScheduled} disabled={loading}>
            Create session
          </Button>
        </div>
      )}
    </div>
  );
}

function SessionMonitorList({
  sessions,
  deriveStatus,
  formatCountdown,
  formatStartsIn,
  killSession,
  loading,
}: {
  sessions: SimSession[];
  deriveStatus: (s: SimSession) => "scheduled" | "running" | "expired" | "deleted";
  formatCountdown: (expiresAt: string) => string;
  formatStartsIn: (startAt: string) => string;
  killSession: (sessionId: string) => Promise<void>;
  loading: boolean;
}) {
  const [liveCountdown, setLiveCountdown] = useState<Record<string, string>>({});
  useEffect(() => {
    const tick = () => {
      const next: Record<string, string> = {};
      for (const s of sessions) {
        const status = deriveStatus(s);
        if (status === "running") next[s.id] = formatCountdown(s.expires_at);
        else if (status === "scheduled" && s.start_at) next[s.id] = formatStartsIn(s.start_at);
        else if (status === "expired") next[s.id] = "Expired";
        else if (status === "deleted") next[s.id] = "Deleted";
      }
      setLiveCountdown(next);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessions, deriveStatus, formatCountdown, formatStartsIn]);
  if (sessions.length === 0) return null;
  return (
    <div className="space-y-2">
      <Label className="text-gray-400">Sessions</Label>
      <ul className="space-y-1 rounded border border-gray-600 bg-gray-900/30 p-2 text-sm">
        {sessions.map((s) => {
          const status = deriveStatus(s);
          const badge =
            status === "running"
              ? "bg-green-600/20 text-green-300"
              : status === "scheduled"
                ? "bg-amber-600/20 text-amber-300"
                : status === "expired"
                  ? "bg-gray-600/20 text-gray-400"
                  : "bg-red-600/20 text-red-300";
          return (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded px-2 py-1">
              <span className="font-mono text-gray-300">{s.id.slice(0, 8)}…</span>
              <Badge variant="secondary" className={badge}>
                {status}
              </Badge>
              <span className="font-mono text-gray-400">{liveCountdown[s.id] ?? "—"}</span>
              {(status === "running" || status === "scheduled" || status === "expired") && (
                <Button size="sm" variant="ghost" className="h-7 text-red-400 hover:text-red-300" onClick={() => killSession(s.id)} disabled={loading}>
                  Kill
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function TestingLabClient() {
  const [sessions, setSessions] = useState<SimSession[]>([]);
  const [activeSession, setActiveSession] = useState<SimSession | null>(null);
  const [countdown, setCountdown] = useState("");
  const [employees, setEmployees] = useState<Persona[]>([]);
  const [employers, setEmployers] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/simulation-lab/session");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const list = (data.sessions ?? []) as SimSession[];
      setSessions(list);
      const active = list.find((s) => deriveStatus(s) === "running" && new Date(s.expires_at) > new Date());
      setActiveSession(active ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sessions");
    }
  }, []);

  const fetchPersonas = useCallback(async () => {
    if (!activeSession?.id) return;
    try {
      const res = await fetch(`/api/admin/simulation-lab/personas?sessionId=${activeSession.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setEmployees(data.employees ?? []);
      setEmployers(data.employers ?? []);
    } catch {
      // ignore
    }
  }, [activeSession?.id]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (!activeSession?.expires_at) {
      setCountdown("");
      return;
    }
    const tick = () => {
      const left = new Date(activeSession.expires_at).getTime() - Date.now();
      if (left <= 0) {
        setCountdown("Expired");
        setActiveSession(null);
        fetchSessions();
        return;
      }
      const m = Math.floor(left / 60000);
      const s = Math.floor((left % 60000) / 1000);
      setCountdown(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeSession?.expires_at, fetchSessions]);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas, activeSession?.id]);

  const startSession = async (opts: { durationMinutes?: number; startAt?: string; endAt?: string; autoDelete?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/simulation-lab/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opts),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setActiveSession(data.session);
      await fetchSessions();
      await fetchPersonas();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  const killSession = async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/simulation-lab/session/kill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kill failed");
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
        setEmployees([]);
        setEmployers([]);
      }
      await fetchSessions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kill failed");
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (!activeSession?.id) return;
    setLoading(true);
    try {
      await fetch(`/api/admin/simulation-lab/session?sessionId=${activeSession.id}`, { method: "DELETE" });
      setActiveSession(null);
      await fetchSessions();
      setEmployees([]);
      setEmployers([]);
    } finally {
      setLoading(false);
    }
  };

  const extendSession = async (minutes: number) => {
    if (!activeSession?.id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/simulation-lab/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSession.id, extendMinutes: minutes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setActiveSession(data.session);
      await fetchSessions();
    } finally {
      setLoading(false);
    }
  };

  const runPurge = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/simulation-lab/purge", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchSessions();
      if (activeSession) await fetchPersonas();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Purge failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</div>
      )}

      {/* A) Simulation Control Panel + Session Scheduling */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg text-gray-100">Simulation Control Panel</CardTitle>
          <p className="text-sm text-gray-400">Start datetime, end datetime, auto-delete. Status: scheduled | running | expired | deleted.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeSession ? (
            <div className="flex flex-wrap items-center gap-4">
              <Badge variant="secondary" className="bg-green-600/20 text-green-300">
                Running
              </Badge>
              <span className="text-sm text-gray-400">Session: {activeSession.id.slice(0, 8)}…</span>
              <span className="text-2xl font-mono text-gray-100">{countdown}</span>
              <Button size="sm" variant="secondary" onClick={() => extendSession(30)} disabled={loading}>
                +30 min
              </Button>
              <Button size="sm" variant="secondary" onClick={endSession} disabled={loading}>
                Deactivate
              </Button>
              <Button size="sm" variant="danger" onClick={() => killSession(activeSession.id)} disabled={loading}>
                Kill & purge
              </Button>
            </div>
          ) : (
            <SessionCreateForm startSession={startSession} loading={loading} />
          )}
          <Button size="sm" variant="ghost" onClick={runPurge} disabled={loading}>
            Run purge (expired + auto-delete)
          </Button>
          <SessionMonitorList sessions={sessions} deriveStatus={deriveStatus} formatCountdown={formatCountdown} formatStartsIn={formatStartsIn} killSession={killSession} loading={loading} />
        </CardContent>
      </Card>

      {/* B) Employee Persona Builder */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg text-gray-100">Employee Persona Builder</CardTitle>
          <p className="text-sm text-gray-400">Creates simulated profile, employment record, runs intelligence pipeline.</p>
        </CardHeader>
        <CardContent>
          <EmployeePersonaForm
            sessionId={activeSession?.id ?? ""}
            disabled={!activeSession}
            onCreated={fetchPersonas}
            setError={setError}
          />
        </CardContent>
      </Card>

      {/* C) Employer Persona Builder */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg text-gray-100">Employer Persona Builder</CardTitle>
          <p className="text-sm text-gray-400">Plan tier, usage simulation. No Stripe, no billing.</p>
        </CardHeader>
        <CardContent>
          <EmployerPersonaForm
            sessionId={activeSession?.id ?? ""}
            disabled={!activeSession}
            onCreated={fetchPersonas}
            setError={setError}
          />
        </CardContent>
      </Card>

      {/* D) Peer Review Simulator */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg text-gray-100">Peer Review Simulator</CardTitle>
          <p className="text-sm text-gray-400">Add review between two simulated employees (same company). Reruns engine.</p>
        </CardHeader>
        <CardContent>
          <PeerReviewForm
            sessionId={activeSession?.id ?? ""}
            employees={employees}
            disabled={!activeSession || employees.length < 2}
            onCreated={fetchPersonas}
            setError={setError}
          />
        </CardContent>
      </Card>

      {/* Data Density Tracker */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg text-gray-100">Data Density Tracker</CardTitle>
          <p className="text-sm text-gray-400">Capture global or session snapshot. View history in Investor Sandbox.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                setError(null);
                try {
                  const res = await fetch("/api/admin/simulation-lab/data-density", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ scope: "global" }),
                  });
                  if (!res.ok) throw new Error(await res.text());
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Capture failed");
                }
              }}
            >
              Capture global snapshot
            </Button>
            {activeSession?.id && (
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  setError(null);
                  try {
                    const res = await fetch("/api/admin/simulation-lab/data-density", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ scope: "session", scopeId: activeSession.id }),
                    });
                    if (!res.ok) throw new Error(await res.text());
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Capture failed");
                  }
                }}
              >
                Capture session snapshot
              </Button>
            )}
            <a href="/admin/investor-sandbox">
              <Button size="sm" variant="ghost">Investor Sandbox →</Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Load Testing Engine */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg text-gray-100">Load Testing Engine</CardTitle>
          <p className="text-sm text-gray-400">Create N simulated employees in one session. Real scoring pipeline. Max 50 per run.</p>
        </CardHeader>
        <CardContent>
          <LoadTestForm sessionId={activeSession?.id ?? ""} disabled={!activeSession} onCreated={fetchPersonas} setError={setError} />
        </CardContent>
      </Card>

      {/* E) Hidden Feature Override */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg text-gray-100">Hidden Feature Override</CardTitle>
          <p className="text-sm text-gray-400">Force-enable hidden features for your admin session. No production leakage.</p>
        </CardHeader>
        <CardContent>
          <HiddenFeatureOverridePanel setError={setError} />
        </CardContent>
      </Card>

      {/* F) Ad Simulation Engine */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader>
          <CardTitle className="text-lg text-gray-100">Ad Simulation Engine</CardTitle>
          <p className="text-sm text-gray-400">Projections only. No writes. User growth, verification volume, revenue.</p>
        </CardHeader>
        <CardContent>
          <AdSimulationForm />
        </CardContent>
      </Card>
    </div>
  );
}

function EmployeePersonaForm({
  sessionId,
  disabled,
  onCreated,
  setError,
}: {
  sessionId: string;
  disabled: boolean;
  onCreated: () => void;
  setError: (s: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("Sim Employee");
  const [jobTitle, setJobTitle] = useState("Associate");
  const [companyName, setCompanyName] = useState("Sim Corp");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("verified");

  const submit = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/simulation-lab/employee-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          fullName,
          jobTitle,
          companyName,
          startDate,
          endDate: endDate || null,
          verificationStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      onCreated();
      setFullName("Sim Employee");
      setJobTitle("Associate");
      setCompanyName("Sim Corp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label className="text-gray-400">Full name</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 bg-gray-900 border-gray-600" />
      </div>
      <div>
        <Label className="text-gray-400">Job title</Label>
        <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="mt-1 bg-gray-900 border-gray-600" />
      </div>
      <div>
        <Label className="text-gray-400">Company name</Label>
        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 bg-gray-900 border-gray-600" />
      </div>
      <div>
        <Label className="text-gray-400">Verification status</Label>
        <select
          value={verificationStatus}
          onChange={(e) => setVerificationStatus(e.target.value)}
          className="mt-1 w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-gray-200"
        >
          <option value="pending">pending</option>
          <option value="matched">matched</option>
          <option value="verified">verified</option>
          <option value="flagged">flagged</option>
        </select>
      </div>
      <div>
        <Label className="text-gray-400">Start date</Label>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 bg-gray-900 border-gray-600" />
      </div>
      <div>
        <Label className="text-gray-400">End date (optional)</Label>
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 bg-gray-900 border-gray-600" />
      </div>
      <div className="sm:col-span-2">
        <Button onClick={submit} disabled={disabled || loading}>
          {loading ? "Creating…" : "Create employee persona"}
        </Button>
      </div>
    </div>
  );
}

function EmployerPersonaForm({
  sessionId,
  disabled,
  onCreated,
  setError,
}: {
  sessionId: string;
  disabled: boolean;
  onCreated: () => void;
  setError: (s: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("Sim Employer Corp");
  const [planTier, setPlanTier] = useState("pro");
  const [searchesUsed, setSearchesUsed] = useState(0);
  const [reportsUsed, setReportsUsed] = useState(0);

  const submit = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/simulation-lab/employer-persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, companyName, planTier, searchesUsed, reportsUsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label className="text-gray-400">Company name</Label>
        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 bg-gray-900 border-gray-600" />
      </div>
      <div>
        <Label className="text-gray-400">Plan tier</Label>
        <select
          value={planTier}
          onChange={(e) => setPlanTier(e.target.value)}
          className="mt-1 w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-gray-200"
        >
          <option value="starter">starter</option>
          <option value="pro">pro</option>
          <option value="custom">custom</option>
        </select>
      </div>
      <div>
        <Label className="text-gray-400">Searches used</Label>
        <Input type="number" min={0} value={searchesUsed} onChange={(e) => setSearchesUsed(Number(e.target.value) || 0)} className="mt-1 bg-gray-900 border-gray-600" />
      </div>
      <div>
        <Label className="text-gray-400">Reports used</Label>
        <Input type="number" min={0} value={reportsUsed} onChange={(e) => setReportsUsed(Number(e.target.value) || 0)} className="mt-1 bg-gray-900 border-gray-600" />
      </div>
      <div className="sm:col-span-2">
        <Button onClick={submit} disabled={disabled || loading}>
          {loading ? "Creating…" : "Create employer persona"}
        </Button>
      </div>
    </div>
  );
}

function PeerReviewForm({
  sessionId,
  employees,
  disabled,
  onCreated,
  setError,
}: {
  sessionId: string;
  employees: Persona[];
  disabled: boolean;
  onCreated: () => void;
  setError: (s: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [reviewerUserId, setReviewerUserId] = useState("");
  const [reviewedUserId, setReviewedUserId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const submit = async () => {
    if (!sessionId || !reviewerUserId || !reviewedUserId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/simulation-lab/peer-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, reviewerUserId, reviewedUserId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      onCreated();
      setComment("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label className="text-gray-400">Reviewer (employee)</Label>
        <select
          value={reviewerUserId}
          onChange={(e) => setReviewerUserId(e.target.value)}
          className="mt-1 w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-gray-200"
        >
          <option value="">Select…</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.full_name ?? e.email ?? e.id.slice(0, 8)}</option>
          ))}
        </select>
      </div>
      <div>
        <Label className="text-gray-400">Reviewed (employee)</Label>
        <select
          value={reviewedUserId}
          onChange={(e) => setReviewedUserId(e.target.value)}
          className="mt-1 w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-gray-200"
        >
          <option value="">Select…</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>{e.full_name ?? e.email ?? e.id.slice(0, 8)}</option>
          ))}
        </select>
      </div>
      <div>
        <Label className="text-gray-400">Rating (1–5)</Label>
        <Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(Number(e.target.value) || 5)} className="mt-1 bg-gray-900 border-gray-600" />
      </div>
      <div className="sm:col-span-2">
        <Label className="text-gray-400">Comment</Label>
        <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional" className="mt-1 bg-gray-900 border-gray-600" />
      </div>
      <div className="sm:col-span-2">
        <Button onClick={submit} disabled={disabled || loading || !reviewerUserId || !reviewedUserId || reviewerUserId === reviewedUserId}>
          {loading ? "Adding…" : "Add peer review & rerun engine"}
        </Button>
      </div>
    </div>
  );
}

function AdSimulationForm() {
  const [channel, setChannel] = useState("linkedin");
  const [budget, setBudget] = useState(5000);
  const [cpc, setCpc] = useState(2.5);
  const [conversionPct, setConversionPct] = useState(3);
  const [projections, setProjections] = useState<{ clicks: number; signups: number; verifications: number; revenue: number } | null>(null);

  const run = () => {
    const clicks = Math.floor(budget / cpc);
    const signups = Math.floor(clicks * (conversionPct / 100));
    const verifications = Math.floor(signups * 0.4);
    const revenue = verifications * 49;
    setProjections({ clicks, signups, verifications, revenue });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label className="text-gray-400">Channel</Label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="mt-1 w-full rounded border border-gray-600 bg-gray-900 px-3 py-2 text-gray-200"
          >
            <option value="linkedin">LinkedIn</option>
            <option value="google">Google</option>
            <option value="meta">Meta</option>
          </select>
        </div>
        <div>
          <Label className="text-gray-400">Budget ($)</Label>
          <Input type="number" min={0} value={budget} onChange={(e) => setBudget(Number(e.target.value) || 0)} className="mt-1 bg-gray-900 border-gray-600" />
        </div>
        <div>
          <Label className="text-gray-400">CPC ($)</Label>
          <Input type="number" min={0} step={0.1} value={cpc} onChange={(e) => setCpc(Number(e.target.value) || 0)} className="mt-1 bg-gray-900 border-gray-600" />
        </div>
        <div>
          <Label className="text-gray-400">Conversion %</Label>
          <Input type="number" min={0} max={100} step={0.1} value={conversionPct} onChange={(e) => setConversionPct(Number(e.target.value) || 0)} className="mt-1 bg-gray-900 border-gray-600" />
        </div>
      </div>
      <Button onClick={run}>Simulate</Button>
      {projections && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-600 bg-gray-900/50 p-4">
            <p className="text-xs text-gray-500">Clicks</p>
            <p className="text-2xl font-bold text-gray-100">{projections.clicks.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-gray-600 bg-gray-900/50 p-4">
            <p className="text-xs text-gray-500">Signups</p>
            <p className="text-2xl font-bold text-gray-100">{projections.signups.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-gray-600 bg-gray-900/50 p-4">
            <p className="text-xs text-gray-500">Verifications</p>
            <p className="text-2xl font-bold text-gray-100">{projections.verifications.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-gray-600 bg-gray-900/50 p-4">
            <p className="text-xs text-gray-500">Revenue (Starter)</p>
            <p className="text-2xl font-bold text-green-400">${projections.revenue.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadTestForm({
  sessionId,
  disabled,
  onCreated,
  setError,
}: {
  sessionId: string;
  disabled: boolean;
  onCreated: () => void;
  setError: (s: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(5);
  const [companyName, setCompanyName] = useState("Load Test Corp");

  const submit = async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/simulation-lab/load-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, count, companyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load test failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label className="text-gray-400">Count (max 50)</Label>
        <Input type="number" min={1} max={50} value={count} onChange={(e) => setCount(Math.min(50, Math.max(1, Number(e.target.value) || 1)))} className="mt-1 bg-gray-900 border-gray-600" />
      </div>
      <div>
        <Label className="text-gray-400">Company name</Label>
        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1 bg-gray-900 border-gray-600" />
      </div>
      <div className="sm:col-span-2">
        <Button onClick={submit} disabled={disabled || loading}>
          {loading ? "Creating…" : "Run load test"}
        </Button>
      </div>
    </div>
  );
}

interface FlagRow {
  id: string;
  name: string;
  key: string;
  description: string | null;
  isGloballyEnabled: boolean;
  visibilityType: string;
  overrideEnabled: boolean | null;
}

function HiddenFeatureOverridePanel({ setError }: { setError: (s: string | null) => void }) {
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/hidden-feature-override");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setFlags(data.flags ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load flags");
    } finally {
      setLoading(false);
    }
  }, [setError]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const toggle = async (featureFlagId: string, enabled: boolean) => {
    setToggling(featureFlagId);
    setError(null);
    try {
      const res = await fetch("/api/admin/hidden-feature-override", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureFlagId, enabled }),
      });
      if (!res.ok) throw new Error(await res.json().then((d) => d.error));
      setFlags((prev) => prev.map((f) => (f.id === featureFlagId ? { ...f, overrideEnabled: enabled } : f)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Toggle failed");
    } finally {
      setToggling(null);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading flags…</p>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 mb-2">
        <a href="/admin/preview-control" className="text-blue-400 hover:underline">Preview Control</a> for tier overrides.
      </p>
      <ul className="max-h-64 overflow-y-auto space-y-2">
        {flags.map((f) => (
          <li key={f.id} className="flex items-center justify-between rounded border border-gray-600 bg-gray-900/50 px-3 py-2">
            <div>
              <span className="text-sm font-medium text-gray-200">{f.name}</span>
              {f.description && <p className="text-xs text-gray-500">{f.description}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{f.overrideEnabled === true ? "On" : f.overrideEnabled === false ? "Off" : "—"}</span>
              <Button
                size="sm"
                variant={f.overrideEnabled === true ? "secondary" : "ghost"}
                onClick={() => toggle(f.id, f.overrideEnabled !== true)}
                disabled={toggling === f.id}
              >
                {toggling === f.id ? "…" : f.overrideEnabled === true ? "Set Off" : "Set On"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
