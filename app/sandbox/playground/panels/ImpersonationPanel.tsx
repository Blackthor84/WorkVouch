"use client";

import { useState, useCallback, useEffect } from "react";

export function ImpersonationPanel() {
  const [loading, setLoading] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [targetName, setTargetName] = useState("Sandbox user");
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [impersonating, setImpersonating] = useState(false);

  const startImpersonation = useCallback(async () => {
    if (!targetUserId.trim()) {
      setMessage("Enter target user ID");
      return;
    }
    setLoading(true);
    setMessage(undefined);
    try {
      const res = await fetch("/api/sandbox/impersonate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: targetUserId.trim(),
          targetName: targetName.trim() || "Sandbox user",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage((data as { error?: string }).error ?? "Failed");
        return;
      }
      setImpersonating(true);
      setMessage("Impersonating. Show global banner.");
    } catch {
      setMessage("Request failed");
    } finally {
      setLoading(false);
    }
  }, [targetUserId, targetName]);

  const exitImpersonation = useCallback(async () => {
    setLoading(true);
    setMessage(undefined);
    try {
      await fetch("/api/sandbox/impersonate/exit", { method: "POST", credentials: "include" });
      setImpersonating(false);
      setMessage("Exited.");
    } catch {
      setMessage("Exit failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const cookie = document.cookie.split(";").find((c) => c.trim().startsWith("sandbox_playground_impersonation="));
      setImpersonating(Boolean(cookie?.includes("id")));
    } catch {
      // ignore
    }
  }, [message]);

  return (
    <div style={{ fontSize: 14 }}>
      <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>ADMIN only. Logs to impersonation_audit. Show &quot;Impersonating sandbox user&quot; banner.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          type="text"
          placeholder="Target user ID"
          value={targetUserId}
          onChange={(e) => setTargetUserId(e.target.value)}
          style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #CBD5E1" }}
        />
        <input
          type="text"
          placeholder="Target name"
          value={targetName}
          onChange={(e) => setTargetName(e.target.value)}
          style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #CBD5E1" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={startImpersonation}
            disabled={loading}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #CBD5E1", background: "#fff", cursor: loading ? "not-allowed" : "pointer" }}
          >
            Start
          </button>
          <button
            type="button"
            onClick={exitImpersonation}
            disabled={loading}
            style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #CBD5E1", background: "#fff", cursor: loading ? "not-allowed" : "pointer" }}
          >
            Exit
          </button>
        </div>
      </div>
      {impersonating && <p style={{ margin: "8px 0 0 0", color: "#059669", fontWeight: 600 }}>Impersonating sandbox user</p>}
      {message && <p style={{ margin: "8px 0 0 0", color: "#64748B" }}>{message}</p>}
    </div>
  );
}
