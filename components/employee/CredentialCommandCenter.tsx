"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type CredentialRow = {
  id: string;
  issued_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  share_token: string | null;
};

function statusLabel(row: CredentialRow): "Active" | "Expired" | "Revoked" {
  if (row.revoked_at) return "Revoked";
  if (row.expires_at && new Date(row.expires_at) < new Date()) return "Expired";
  return "Active";
}

export function CredentialCommandCenter() {
  const [credentials, setCredentials] = useState<CredentialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchList = () => {
    fetch("/api/user/workvouch-credential", { credentials: "include" })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("Failed to load")))
      .then((data: { credentials?: CredentialRow[] }) => {
        setCredentials(Array.isArray(data.credentials) ? data.credentials : []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleRevoke = async (id: string) => {
    setActionId(id);
    setError(null);
    try {
      const res = await fetch(`/api/user/workvouch-credential/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ revoke: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to revoke");
      fetchList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Revoke failed");
    } finally {
      setActionId(null);
    }
  };

  const handleRegenerate = async () => {
    setActionId("new");
    setError(null);
    try {
      const res = await fetch("/api/user/workvouch-credential", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ includeShareToken: true, expiresInDays: 30, visibility: "standard" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to create");
      fetchList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Credential management</h2>
        <p className="text-sm text-slate-500">Loading…</p>
      </Card>
    );
  }

  const copyLink = (token: string) => {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/c/${encodeURIComponent(token)}`;
    navigator.clipboard.writeText(url).catch(() => {});
  };

  const daysUntilExpiry = (expiresAt: string | null): number | null => {
    if (!expiresAt) return null;
    const exp = new Date(expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((exp - now) / (24 * 60 * 60 * 1000)));
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">My Credentials</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Revoke and regenerate invalidate old links immediately.
      </p>
      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}
      <div className="mb-4">
        <Button onClick={handleRegenerate} disabled={actionId !== null}>
          {actionId === "new" ? "Creating…" : "Regenerate"}
        </Button>
      </div>
      {credentials.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No credentials yet. Issue one to get a shareable link.</p>
      ) : (
        <ul className="space-y-3">
          {credentials.map((row) => {
            const status = statusLabel(row);
            const days = daysUntilExpiry(row.expires_at);
            return (
              <li key={row.id} className="flex flex-col gap-2 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Issued {new Date(row.issued_at).toLocaleDateString()}
                    </span>
                    {row.expires_at && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                        {days != null ? `Expires in ${days} days` : `Expired`}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${
                      status === "Active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        : status === "Revoked"
                          ? "bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                    }`}
                  >
                    {status === "Active" ? "Active" : status === "Revoked" ? "Revoked" : "Expired"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {status === "Active" && row.share_token && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyLink(row.share_token!)}
                      >
                        Copy link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionId === row.id}
                        onClick={() => handleRevoke(row.id)}
                      >
                        {actionId === row.id ? "Revoking…" : "Revoke"}
                      </Button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
