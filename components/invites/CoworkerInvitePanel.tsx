"use client";

import { useState } from "react";
import { ClipboardDocumentIcon, EnvelopeIcon } from "@heroicons/react/24/outline";

const INVITE_STORAGE_KEY = "workvouch_coworker_invite_token";

export function persistInviteTokenForSignup(token: string) {
  try {
    sessionStorage.setItem(INVITE_STORAGE_KEY, token);
  } catch {
    /* ignore */
  }
}

export function consumeInviteTokenFromStorage(): string | null {
  try {
    const t = sessionStorage.getItem(INVITE_STORAGE_KEY);
    if (t) sessionStorage.removeItem(INVITE_STORAGE_KEY);
    return t;
  } catch {
    return null;
  }
}

export function peekInviteTokenFromStorage(): string | null {
  try {
    return sessionStorage.getItem(INVITE_STORAGE_KEY);
  } catch {
    return null;
  }
}

type CoworkerInvitePanelProps = {
  companyName: string;
  jobId?: string | null;
  onSent?: () => void;
  compact?: boolean;
};

export function CoworkerInvitePanel({ companyName, jobId, onSent, compact }: CoworkerInvitePanelProps) {
  const [email, setEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copyOk, setCopyOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createInvite() {
    setError(null);
    setCopyOk(false);
    const clean = email.trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError("Enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/invites/coworker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: clean,
          company_name: companyName,
          job_id: jobId ?? undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not create invite");
        return;
      }
      setInviteUrl(data.inviteUrl ?? null);
      onSent?.();
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopyOk(true);
      setTimeout(() => setCopyOk(false), 2000);
    } catch {
      setError("Could not copy — copy the link manually");
    }
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <EnvelopeIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="coworker@company.com"
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-3 text-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
          />
        </div>
        <button
          type="button"
          onClick={createInvite}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 shrink-0"
        >
          {loading ? "Sending…" : "Email invite"}
        </button>
      </div>

      {inviteUrl && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:bg-slate-800 dark:border-slate-600">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Invite link</p>
          <p className="text-sm text-slate-800 dark:text-slate-200 break-all font-mono">{inviteUrl}</p>
          <button
            type="button"
            onClick={copyLink}
            className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            <ClipboardDocumentIcon className="h-5 w-5" />
            {copyOk ? "Copied!" : "Copy invite link"}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
