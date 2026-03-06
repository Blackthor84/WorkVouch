"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { DocumentCheckIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

type CredentialRow = {
  id: string;
  issued_at: string;
  expires_at: string | null;
  revoked_at: string | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CredentialStatusCard() {
  const [credentials, setCredentials] = useState<CredentialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/user/workvouch-credential", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load credentials");
        return res.json();
      })
      .then((data: { credentials?: CredentialRow[] }) => {
        if (!cancelled && Array.isArray(data.credentials)) {
          setCredentials(data.credentials);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Credential status
        </h2>
        <div className="h-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Credential status
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
      </Card>
    );
  }

  const now = Date.now();
  const active = credentials.filter(
    (c) => !c.revoked_at && (!c.expires_at || new Date(c.expires_at).getTime() > now)
  );
  const expired = credentials.filter(
    (c) => !c.revoked_at && c.expires_at && new Date(c.expires_at).getTime() <= now
  );
  const revoked = credentials.filter((c) => c.revoked_at);

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Credential status
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        WorkVouch credentials you have issued and their status.
      </p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center">
          <div className="flex justify-center mb-1">
            <DocumentCheckIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{active.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Active</div>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{expired.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Expired</div>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 text-center">
          <div className="flex justify-center mb-1">
            <ExclamationCircleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{revoked.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Revoked</div>
        </div>
      </div>

      {credentials.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No credentials yet. Create and share a WorkVouch credential from the Credential Sharing panel.
        </p>
      ) : (
        <ul className="space-y-2 text-sm">
          {credentials.slice(0, 3).map((c) => {
            const isActive = !c.revoked_at && (!c.expires_at || new Date(c.expires_at).getTime() > now);
            const isRevoked = !!c.revoked_at;
            const status = isRevoked ? "Revoked" : isActive ? "Active" : "Expired";
            return (
              <li
                key={c.id}
                className="flex justify-between items-center rounded border border-slate-200 dark:border-slate-700 px-3 py-2"
              >
                <span className="text-slate-600 dark:text-slate-300">
                  Issued {formatDate(c.issued_at)}
                  {c.expires_at && !isRevoked && ` · Expires ${formatDate(c.expires_at)}`}
                </span>
                <span
                  className={
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400 font-medium"
                      : isRevoked
                        ? "text-amber-600 dark:text-amber-400 font-medium"
                        : "text-slate-500 dark:text-slate-400"
                  }
                >
                  {status}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
