"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { SandboxUser } from "../SandboxPlaygroundPanels";

type Props = { users?: SandboxUser[]; sandboxId?: string };

export function ImpersonationPanel({ users = [], sandboxId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [targetName, setTargetName] = useState("Sandbox user");
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [impersonating, setImpersonating] = useState(false);

  const startImpersonation = useCallback(async () => {
    const userId = targetUserId.trim();
    if (!userId) {
      setMessage("Enter or select target user ID");
      return;
    }
    const payload: { userId: string } = { userId };
    console.log("Impersonate userId (before fetch):", payload.userId);
    setLoading(true);
    setMessage(undefined);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage((data as { error?: string }).error ?? "Failed");
        return;
      }
      setImpersonating(true);
      const redirectUrl = (data as { redirectUrl?: string }).redirectUrl ?? "/dashboard";
      setMessage("Impersonating. Redirecting…");
      router.refresh();
      window.location.href = redirectUrl;
    } catch {
      setMessage("Request failed");
    } finally {
      setLoading(false);
    }
  }, [targetUserId, router]);

  const exitImpersonation = useCallback(async () => {
    setLoading(true);
    setMessage(undefined);
    try {
      const res = await fetch("/api/admin/impersonate/exit", { method: "POST", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      setImpersonating(false);
      const redirectUrl = (data as { redirectUrl?: string }).redirectUrl ?? "/admin";
      window.location.href = redirectUrl;
    } catch {
      setMessage("Exit failed");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/impersonate/status")
      .then((r) => r.json())
      .then((data) => setImpersonating(Boolean(data?.impersonating)))
      .catch(() => setImpersonating(false));
  }, [message]);

  const selectUser = (u: SandboxUser) => {
    setTargetUserId(u.id);
    setTargetName(u.name);
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      setTargetUserId("");
      setTargetName("Sandbox user");
      return;
    }
    const u = users.find((x) => x.id === id);
    if (u) selectUser(u);
  };

  return (
    <div style={{ fontSize: 14 }}>
      <p style={{ margin: "0 0 8px 0", color: "#64748B" }}>
        One-click impersonate. Navigate the full site as that user. No production data affected.
      </p>
      {users.length > 0 ? (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "#64748B" }}>Sandbox user</label>
          <select
            value={targetUserId}
            onChange={handleDropdownChange}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 14 }}
          >
            <option value="">— Select user —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role}) — {u.id.slice(0, 8)}…
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#64748B" }}>Generate a company to see users.</p>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={startImpersonation}
          disabled={loading || !targetUserId}
          style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #CBD5E1", background: "#fff", cursor: loading || !targetUserId ? "not-allowed" : "pointer" }}
        >
          Impersonate
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
      {impersonating && (
        <div style={{ marginTop: 12, padding: 10, background: "#ECFDF5", borderRadius: 6, border: "1px solid #10B981" }}>
          <p style={{ margin: 0, color: "#059669", fontWeight: 600 }}>
            Impersonating sandbox user — no production data affected
          </p>
        </div>
      )}
      {message && !impersonating && <p style={{ margin: "8px 0 0 0", color: "#64748B" }}>{message}</p>}
    </div>
  );
}
