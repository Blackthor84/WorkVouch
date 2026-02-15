"use client";

import { useState, useCallback } from "react";

const TRIGGERS = [
  "leave-vouch",
  "submit-culture",
  "flag-dispute",
  "confirm-coworker",
  "complete-profile",
  "flag-fraud",
] as const;

export function FlowTriggersPanel() {
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [sandboxId, setSandboxId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [coworkerId, setCoworkerId] = useState("");

  const fire = useCallback(async (action: string) => {
    setLoading(true);
    setError(undefined);
    setLastAction(undefined);
    try {
      let url = `/api/sandbox/trigger/${action.replace(/_/g, "-")}`;
      let body: Record<string, unknown> = {};
      if (action === "leave-vouch") {
        url = "/api/sandbox/trigger/leave-vouch";
        body = { sandboxId: sandboxId.trim() || undefined, workerId: workerId.trim() || undefined, coworkerId: coworkerId.trim() || undefined };
      }
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: Object.keys(body).length ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Trigger failed");
        return;
      }
      setLastAction(action);
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }, [sandboxId, workerId, coworkerId]);

  return (
    <div style={{ fontSize: 14 }}>
      <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>Same internal services as production. Always is_sandbox = true.</p>
      <div style={{ marginBottom: 8 }}>
        <input type="text" placeholder="sandboxId (for leave-vouch)" value={sandboxId} onChange={(e) => setSandboxId(e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #CBD5E1", marginBottom: 4 }} />
        <input type="text" placeholder="workerId" value={workerId} onChange={(e) => setWorkerId(e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #CBD5E1", marginBottom: 4 }} />
        <input type="text" placeholder="coworkerId" value={coworkerId} onChange={(e) => setCoworkerId(e.target.value)} style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #CBD5E1" }} />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {TRIGGERS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => fire(t)}
            disabled={loading}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #CBD5E1", background: "#fff", cursor: loading ? "not-allowed" : "pointer", fontSize: 12 }}
          >
            {t}
          </button>
        ))}
      </div>
      {error && <p style={{ margin: "8px 0 0 0", color: "#DC2626" }}>{error}</p>}
      {lastAction && <p style={{ margin: "8px 0 0 0", color: "#059669" }}>Fired: {lastAction}</p>}
    </div>
  );
}
