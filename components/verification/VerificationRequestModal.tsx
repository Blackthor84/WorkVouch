"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";

type EmploymentEntry = {
  id: string;
  company_name: string;
  job_title: string;
  verification_status: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function VerificationRequestModal({ open, onOpenChange, onSuccess }: Props) {
  const [targetEmail, setTargetEmail] = useState("");
  const [employmentRecordId, setEmploymentRecordId] = useState("");
  const [relationshipType, setRelationshipType] = useState<"coworker" | "manager" | "peer">("coworker");
  const [entries, setEntries] = useState<EmploymentEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    request_id: string;
    target_email: string;
    response_token: string;
    has_account: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSuccessResult(null);
    setError(null);
    setSubmitting(false);
    setLoadingEntries(true);
    fetch("/api/user/employment-history", { credentials: "include" })
      .then((res) => res.ok ? res.json() : { entries: [] })
      .then((data: { entries?: EmploymentEntry[] }) => {
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        if (Array.isArray(data.entries) && data.entries.length > 0 && !employmentRecordId) {
          setEmploymentRecordId(data.entries[0].id);
        }
      })
      .finally(() => setLoadingEntries(false));
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/verification/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          target_email: targetEmail.trim().toLowerCase(),
          employment_record_id: employmentRecordId,
          relationship_type: relationshipType,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to send request");
        return;
      }
      setSuccessResult({
        request_id: (data as { request_id: string }).request_id,
        target_email: (data as { target_email: string }).target_email,
        response_token: (data as { response_token: string }).response_token,
        has_account: (data as { has_account?: boolean }).has_account ?? false,
      });
      onSuccess?.();
    } finally {
      setSubmitting(false);
    }
  };

  const responseLink =
    successResult && typeof window !== "undefined"
      ? `${window.location.origin}/verification/respond/${successResult.response_token}`
      : "";

  const copyLink = async () => {
    if (!responseLink) return;
    try {
      await navigator.clipboard.writeText(responseLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link");
    }
  };

  const close = () => {
    setSuccessResult(null);
    setTargetEmail("");
    setEmploymentRecordId("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !successResult && onOpenChange(o)}>
      <div className="relative">
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {successResult ? "Request sent" : "Request verification"}
            </DialogTitle>
          </DialogHeader>

          {successResult ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                We sent a verification request to <strong>{successResult.target_email}</strong>.
              </p>
              {!successResult.has_account && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-3">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    This email is not registered. Share the link below so they can sign up and respond.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={responseLink}
                      className="flex-1 min-w-0 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm"
                    />
                    <Button variant="secondary" size="sm" onClick={copyLink}>
                      {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
                      {copied ? "Copied" : "Copy link"}
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={close}>Done</Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Colleague&apos;s email
                </label>
                <input
                  type="email"
                  required
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Employment to verify
                </label>
                <select
                  required
                  value={employmentRecordId}
                  onChange={(e) => setEmploymentRecordId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
                >
                  {loadingEntries ? (
                    <option value="">Loading...</option>
                  ) : (
                    entries.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.job_title} at {e.company_name}
                        {e.verification_status === "verified" ? " (already verified)" : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Their relationship to you
                </label>
                <select
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value as "coworker" | "manager" | "peer")}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100"
                >
                  <option value="coworker">Coworker</option>
                  <option value="manager">Manager / Supervisor</option>
                  <option value="peer">Peer</option>
                </select>
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Sending…" : "Send request"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </div>
    </Dialog>
  );
}
