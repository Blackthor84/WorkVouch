"use client";

import { useState, useCallback, useEffect } from "react";
import { HiddenSystemsObserverPanel, type ObserverData } from "./panels/HiddenSystemsObserverPanel";
import { ImpersonationPanel } from "./panels/ImpersonationPanel";

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

/** Three sections: Demo Setup, Run Scenarios, Hidden Systems Observer. Guided UX. */
export function SandboxPlaygroundPanels() {
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [listUsers, setListUsers] = useState<SandboxUser[]>([]);
  const [observerData, setObserverData] = useState<ObserverData | undefined>(undefined);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  const fetchObserver = useCallback(async () => {
    try {
      const res = await fetch("/api/sandbox/observer", { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json().catch(() => ({}));
      setObserverData({
        trustDelta: json.trustDelta,
        culture: Array.isArray(json.culture) ? json.culture : [],
        signals: Array.isArray(json.signals) ? json.signals : [],
        abuseRisk: typeof json.abuseRisk === "number" ? json.abuseRisk : undefined,
      });
    } catch {
      setObserverData(undefined);
    }
  }, []);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/sandbox/list", { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json().catch(() => ({}));
      setListUsers(Array.isArray(json.users) ? json.users : []);
      if (company?.sandboxId && !company.employer && json.sandboxId === company.sandboxId) {
        setCompany((c) => (c ? { ...c, sandboxId: json.sandboxId } : null));
      }
    } catch {
      setListUsers([]);
    }
  }, [company?.sandboxId]);

  useEffect(() => {
    fetchObserver();
    fetchList();
  }, [fetchObserver]);

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
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed");
        return;
      }
      setCompany(null);
      setListUsers([]);
      setObserverData(undefined);
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
    if (company?.sandboxId && listUsers.length === 0) fetchList();
  }, [company?.sandboxId, listUsers.length, fetchList]);

  const users = listUsers.length > 0 ? listUsers : (company?.workers?.map((w) => ({ id: w.id, name: w.full_name ?? "Worker", role: "worker" as const })) ?? []);

  return (
    <div style={{ marginTop: 24 }}>
      {error && (
        <div style={{ marginBottom: 16, padding: 12, background: "#FEF2F2", borderRadius: 8, color: "#DC2626" }}>
          {error}
        </div>
      )}

      {/* SECTION 1 — Demo Setup */}
      <section style={sectionStyle}>
        <h2 style={{ margin: "0 0 12px 0", fontSize: 18, fontWeight: 600 }}>Demo Setup</h2>
        <p style={{ margin: "0 0 12px 0", color: "#64748B", fontSize: 14 }}>
          One click creates 1 employer + 5 workers. All sandbox-flagged. Copy IDs below.
        </p>
        <div style={{ marginBottom: 12 }}>
          <button type="button" onClick={handleGenerateCompany} disabled={loading !== null} style={btn}>
            {loading === "company" ? "Creating…" : "Generate Full Company"}
          </button>
          <button type="button" onClick={handleReset} disabled={loading !== null} style={btn}>
            {loading === "reset" ? "Resetting…" : "Reset Sandbox Data"}
          </button>
        </div>
        {company?.sandboxId && (
          <div style={{ fontSize: 12, fontFamily: "monospace", marginTop: 8 }}>
            <div><strong>sandboxId</strong> <code style={{ background: "#E2E8F0", padding: "2px 6px", borderRadius: 4 }}>{company.sandboxId}</code></div>
            {company.employer && (
              <div style={{ marginTop: 4 }}><strong>employer</strong> <code style={{ background: "#E2E8F0", padding: "2px 6px", borderRadius: 4 }}>{company.employer.id}</code> {company.employer.company_name}</div>
            )}
            {company.workers?.length ? (
              <div style={{ marginTop: 4 }}>
                <strong>workers</strong>{" "}
                {company.workers.map((w, i) => (
                  <code key={w.id} style={{ background: "#E2E8F0", padding: "2px 6px", borderRadius: 4, marginRight: 4 }} title={w.id}>
                    {w.id.slice(0, 8)}…
                  </code>
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
          {loading === "company" || (loading === null && !observerData && !company) ? (
            <p style={{ margin: 0, color: "#64748B" }}>Generate a company or run a scenario to see data.</p>
          ) : (
            <>
              <HiddenSystemsObserverPanel data={observerData} />
              <button
                type="button"
                onClick={fetchObserver}
                disabled={loading !== null}
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
