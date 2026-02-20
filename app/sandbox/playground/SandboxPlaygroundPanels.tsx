"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { HiddenSystemsObserverPanel, type ObserverData } from "./panels/HiddenSystemsObserverPanel";
import { ImpersonationPanel } from "./panels/ImpersonationPanel";

function CopyableId({
  label,
  value,
  suffix = "",
}: { label?: string; value: string; suffix?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [value]);
  return (
    <>
      {label ? <strong>{label}</strong> : null}
      {label ? " " : null}
      <code style={{ background: "#E2E8F0", padding: "2px 6px", borderRadius: 4 }}>{value}</code>
      <button
        type="button"
        onClick={copy}
        style={{ marginLeft: 6, padding: "2px 8px", fontSize: 11, cursor: "pointer", border: "1px solid #94A3B8", borderRadius: 4 }}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      {suffix ? <span style={{ color: "#64748B" }}>{suffix}</span> : null}
    </>
  );
}

export type SandboxUser = { id: string; name: string; role: "worker" | "employer" };

type CompanyData = {
  sandboxId?: string;
  employer?: { id: string; company_name?: string };
  workers?: { id: string; full_name?: string }[];
};

const sectionStyle = {
  border: "1px solid #E2E8F0",
  borderRadius: 8,
  padding: 16,
  background: "#F8FAFC",
  marginBottom: 24,
};
const btn = {
  padding: "8px 16px",
  borderRadius: 6,
  border: "1px solid #CBD5E1",
  background: "#fff",
  cursor: "pointer" as const,
  fontSize: 14,
  marginRight: 8,
  marginBottom: 8,
};

const EMPTY_OBSERVER: ObserverData = {
  trustDelta: 0,
  culture: [],
  signals: [],
  abuseRisk: undefined,
  reputation_changes: [],
  abuse_flags: [],
  risk_signals: [],
  trust_scores: [],
};

/** Three sections: Demo Setup, Run Scenarios, Hidden Systems Observer. Renders immediately; not blocked by observer/list. */
export function SandboxPlaygroundPanels() {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [listUsers, setListUsers] = useState<SandboxUser[]>([]);
  const [observerData, setObserverData] = useState<ObserverData | undefined>(undefined);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [sandboxAccessDenied, setSandboxAccessDenied] = useState(false);
  const [safeMode, setSafeMode] = useState(false);
  const [scenarioEvents, setScenarioEvents] = useState<{ type: string; scenario?: string; count?: number; delta?: number }[]>([]);
  const observerFetchedRef = useRef(false);
  const listFetchedRef = useRef(false);

  const fetchObserver = useCallback(async () => {
    if (sandboxAccessDenied) return;
    try {
      const res = await fetch("/api/sandbox/observer", { credentials: "include" });
      if (res.status === 403) {
        setSandboxAccessDenied(true);
        setObserverData(EMPTY_OBSERVER);
        return;
      }
      const json = await res.json().catch(() => ({}));
      setObserverData({
        trustDelta: typeof json.trustDelta === "number" ? json.trustDelta : 0,
        culture: Array.isArray(json.culture) ? json.culture : [],
        signals: Array.isArray(json.signals) ? json.signals : [],
        abuseRisk: typeof json.abuseRisk === "number" ? json.abuseRisk : undefined,
        reputation_changes: Array.isArray(json.reputation_changes) ? json.reputation_changes : [],
        abuse_flags: Array.isArray(json.abuse_flags) ? json.abuse_flags : [],
        risk_signals: Array.isArray(json.risk_signals) ? json.risk_signals : [],
        trust_scores: Array.isArray(json.trust_scores) ? json.trust_scores : [],
      });
    } catch {
      setObserverData(EMPTY_OBSERVER);
    }
  }, [sandboxAccessDenied]);

  const fetchList = useCallback(async () => {
    if (sandboxAccessDenied) return;
    try {
      const res = await fetch("/api/sandbox/list", { credentials: "include" });
      if (res.status === 403) {
        setSandboxAccessDenied(true);
        setListUsers([]);
        return;
      }
      const json = await res.json().catch(() => ({}));
      setListUsers(Array.isArray(json.users) ? json.users : []);
      if (company?.sandboxId && !company.employer && json.sandboxId === company.sandboxId) {
        setCompany((c) => (c ? { ...c, sandboxId: json.sandboxId } : null));
      }
    } catch {
      setListUsers([]);
    }
  }, [company?.sandboxId, sandboxAccessDenied]);

  useEffect(() => {
    if (!observerFetchedRef.current) {
      observerFetchedRef.current = true;
      fetchObserver();
    }
  }, [fetchObserver]);
  useEffect(() => {
    if (!listFetchedRef.current) {
      listFetchedRef.current = true;
      fetchList();
    }
  }, [fetchList]);

  const handleGenerateCompany = useCallback(async () => {
    setLoading("company");
    setError(undefined);
    try {
      const res = await fetch("/api/sandbox/generate-company", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed");
        return;
      }
      setCompany({
        sandboxId: (data as { sandboxId?: string }).sandboxId,
        employer: (data as { employer?: { id: string; company_name?: string } }).employer,
        workers: (data as { workers?: { id: string; full_name?: string }[] }).workers ?? [],
      });
      await fetchList();
      await fetchObserver();
    } catch {
      setError("Request failed");
    } finally {
      setLoading(null);
    }
  }, [fetchList, fetchObserver]);

  const handleReset = useCallback(async () => {
    setLoading("reset");
    setError(undefined);
    try {
      const res = await fetch("/api/sandbox/reset", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403) {
        setSandboxAccessDenied(true);
        setError((data as { error?: string }).error ?? "Sandbox access denied");
        return;
      }
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed");
        return;
      }
      const newId = (data as { sandboxId?: string }).sandboxId;
      setCompany(newId ? { sandboxId: newId } : null);
      setListUsers([]);
      setObserverData(undefined);
      setSafeMode(false);
      await fetchObserver();
    } catch {
      setError("Request failed");
    } finally {
      setLoading(null);
    }
  }, [fetchObserver]);

  const handleRunScenario = useCallback(
    async (scenario: string) => {
      setLoading(scenario);
      setError(undefined);
      try {
        const res = await fetch("/api/sandbox/run-scenario", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenario,
            sandboxId: company?.sandboxId,
            workerIds: company?.workers?.map((w) => w.id),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 403) {
          setSandboxAccessDenied(true);
          setError((data as { error?: string }).error ?? "Sandbox access denied");
          return;
        }
        if (!res.ok) {
          setError((data as { error?: string }).error ?? "Failed");
          return;
        }
        await fetchObserver();
      } catch {
        setError("Request failed");
      } finally {
        setLoading(null);
      }
    },
    [company?.sandboxId, company?.workers, fetchObserver]
  );

  useEffect(() => {
    if (company?.sandboxId && listUsers.length === 0 && !sandboxAccessDenied) fetchList();
  }, [company?.sandboxId, listUsers.length, sandboxAccessDenied, fetchList]);

  const users = listUsers.length > 0 ? listUsers : (company?.workers?.map((w) => ({ id: w.id, name: w.full_name ?? "Worker", role: "worker" as const })) ?? []);

  return (
    <div style={{ marginTop: 24 }}>
      {sandboxAccessDenied && (
        <div style={{ marginBottom: 16, padding: 12, background: "#FEF3C7", borderRadius: 8, color: "#92400E" }}>
          Simulation access denied. You need admin or superadmin role to use the Playground.
        </div>
      )}
      {safeMode && (
        <div style={{ marginBottom: 16, padding: 12, background: "#E0F2FE", borderRadius: 8, color: "#0369A1" }}>
          Safe mode: database unavailable. IDs are in-memory only. Observer and scenarios may show no data.
        </div>
      )}
      {error && (
        <div style={{ marginBottom: 16, padding: 12, background: "#FEF2F2", borderRadius: 8, color: "#DC2626" }}>
          {error}
        </div>
      )}

      {/* SECTION 1 — Demo Setup */}
      <section style={sectionStyle}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: 18, fontWeight: 600 }}>Demo Setup</h2>
        <p style={{ margin: "0 0 12px 0", color: "#64748B", fontSize: 14 }}>
          One click creates 1 employer + 5 workers (simulation-only). Copy IDs below.
        </p>
        <div style={{ marginBottom: 12 }}>
          <button type="button" onClick={handleGenerateCompany} disabled={loading !== null} style={btn}>
            {loading === "company" ? "Creating…" : "Generate Full Company"}
          </button>
          <button type="button" onClick={handleReset} disabled={loading !== null} style={btn}>
            {loading === "reset" ? "Resetting…" : "Reset simulation data"}
          </button>
        </div>
        {company?.sandboxId && (
          <div style={{ fontSize: 12, fontFamily: "monospace", marginTop: 8 }}>
            <div style={{ marginBottom: 4 }}>
              <CopyableId label="Simulation ID" value={company.sandboxId} />
            </div>
            {company.employer && (
              <div style={{ marginTop: 4 }}>
                <strong>employer</strong>{" "}
                <CopyableId value={company.employer.id} /> {company.employer.company_name}
              </div>
            )}
            {company.workers?.length ? (
              <div style={{ marginTop: 4 }}>
                <strong>workers</strong>
                {company.workers.map((w) => (
                  <div key={w.id} style={{ marginTop: 2 }}>
                    <CopyableId value={w.id} suffix={w.full_name ? ` ${w.full_name}` : ""} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* SECTION 2 — Run Scenarios */}
      <section style={sectionStyle}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: 18, fontWeight: 600 }}>Run Scenarios</h2>
        <p style={{ margin: "0 0 12px 0", color: "#64748B", fontSize: 14 }}>
          Real peer reviews and intel. Observer updates after each run.
        </p>
        <div style={{ flexWrap: "wrap", display: "flex", gap: 8 }}>
          {(["healthy-team", "toxic-manager", "high-turnover", "mixed-reputation"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleRunScenario(s)}
              disabled={loading !== null || !company?.sandboxId}
              style={btn}
            >
              {loading === s ? "Running…" : s.replace(/-/g, " ")}
            </button>
          ))}
        </div>
      </section>

      {/* Impersonation + Observer row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <section style={sectionStyle}>
          <h2 style={{ margin: "0 0 12px 0", fontSize: 18, fontWeight: 600 }}>Impersonate</h2>
          <ImpersonationPanel users={users} sandboxId={company?.sandboxId} />
        </section>
        <section style={sectionStyle}>
          <h2 style={{ margin: "0 0 12px 0", fontSize: 18, fontWeight: 600 }}>Hidden Systems Observer (Live)</h2>
          {loading === "company" ? (
            <p style={{ margin: 0, color: "#64748B" }}>Creating company…</p>
          ) : (
            <>
              {scenarioEvents.length > 0 && (
                <div style={{ marginBottom: 12, fontSize: 12, color: "#64748B" }}>
                  <strong>Last scenario run:</strong>
                  <ul style={{ margin: "4px 0 0 0", paddingLeft: 18 }}>
                    {scenarioEvents.map((e, i) => (
                      <li key={i}>
                        {e.type}
                        {e.scenario != null ? ` (${e.scenario})` : ""}
                        {e.count != null ? ` count=${e.count}` : ""}
                        {e.delta != null ? ` Δ=${e.delta}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <HiddenSystemsObserverPanel data={observerData ?? EMPTY_OBSERVER} />
              <button
                type="button"
                onClick={fetchObserver}
                disabled={loading !== null || sandboxAccessDenied}
                style={{ marginTop: 12, ...btn }}
              >
                Refresh
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
