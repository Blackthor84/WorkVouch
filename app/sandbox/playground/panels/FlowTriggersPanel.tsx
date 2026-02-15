"use client";

import { useState, useCallback } from "react";
import type { SandboxUser } from "../SandboxPlaygroundPanels";

const TRIGGERS = [
  "leave-vouch",
  "submit-culture",
  "flag-dispute",
  "confirm-coworker",
  "complete-profile",
  "flag-fraud",
] as const;

type FlowTriggersPanelProps = {
  sandboxId?: string;
  users?: SandboxUser[];
  onTriggerFired?: () => void;
};

export function FlowTriggersPanel({
  sandboxId = "",
  users = [],
  onTriggerFired,
}: FlowTriggersPanelProps) {
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [workerId, setWorkerId] = useState("");
  const [coworkerId, setCoworkerId] = useState("");

  const workers = users.filter((u) => u.role === "worker");
  const canLeaveVouch =
    Boolean(sandboxId && workerId && coworkerId && workerId !== coworkerId) && workers.length >= 2;

  const fire = useCallback(
    async (action: string) => {
      setLoading(true);
      setError(undefined);
      setLastAction(undefined);
      try {
        let url = `/api/sandbox/trigger/${action.replace(/_/g, "-")}`;
        let body: Record<string, unknown> = {};
        if (action === "leave-vouch") {
          url = "/api/sandbox/trigger/leave-vouch";
          body = {
            sandboxId: sandboxId || undefined,
            workerId: workerId || undefined,
            coworkerId: coworkerId || undefined,
          };
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
        onTriggerFired?.();
      } catch {
        setError("Request failed");
      } finally {
        setLoading(false);
      }
    },
    [sandboxId, workerId, coworkerId, onTriggerFired]
  );

  return (
    <div style={{ fontSize: 14 }}>
      <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>
        leave-vouch calls real peer-reviews service. Other triggers are stubs. is_sandbox = true.
      </p>
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, color: "#64748B" }}>sandboxId (from list)</label>
        <input
          type="text"
          placeholder="Paste sandboxId or spawn first"
          value={sandboxId}
          readOnly
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid #E2E8F0",
            marginBottom: 4,
            background: "#f1f5f9",
            fontSize: 12,
          }}
        />
        <label style={{ fontSize: 12, color: "#64748B" }}>workerId (reviewer)</label>
        <input
          type="text"
          placeholder="Paste or select from list"
          value={workerId}
          onChange={(e) => setWorkerId(e.target.value)}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid #CBD5E1",
            marginBottom: 4,
          }}
        />
        <label style={{ fontSize: 12, color: "#64748B" }}>coworkerId (reviewed)</label>
        <input
          type="text"
          placeholder="Paste or select from list"
          value={coworkerId}
          onChange={(e) => setCoworkerId(e.target.value)}
          style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid #CBD5E1" }}
        />
        {workers.length >= 2 && (
          <p style={{ margin: "4px 0 0 0", fontSize: 11, color: "#64748B" }}>
            Workers: {workers.map((w) => w.id.slice(0, 8)).join(", ")}…
          </p>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {TRIGGERS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => fire(t)}
            disabled={
              loading ||
              (t === "leave-vouch" && !canLeaveVouch)
            }
            title={t === "leave-vouch" && !canLeaveVouch ? "Set sandboxId, workerId, coworkerId" : undefined}
            style={{
              padding: "6px 10px",
              borderRadius: 6,
              border: "1px solid #CBD5E1",
              background: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 12,
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {error && <p style={{ margin: "8px 0 0 0", color: "#DC2626" }}>{error}</p>}
      {lastAction && (
        <p style={{ margin: "8px 0 0 0", color: "#059669" }}>Fired: {lastAction}</p>
      )}
    </div>
  );
}
