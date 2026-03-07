"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface InviteCoworkerFormProps {
  /** When omitted, form fetches current user profile id from /api/user/me */
  candidateId?: string;
  onClose?: () => void;
}

export function InviteCoworkerForm({ candidateId: propCandidateId, onClose }: InviteCoworkerFormProps) {
  const [candidateId, setCandidateId] = useState(propCandidateId ?? "");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (propCandidateId) {
      setCandidateId(propCandidateId);
      return;
    }
    let cancelled = false;
    fetch("/api/user/me", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((data: { user?: { id?: string } } | null) => {
        if (!cancelled && data?.user?.id) setCandidateId(data.user.id);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [propCandidateId]);

  const canSubmit = Boolean(candidateId?.trim());
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInviteLink(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/verification/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          candidateId,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          company: company.trim() || undefined,
          role: role.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Request failed");
        return;
      }
      const link = (data as { inviteLink?: string }).inviteLink;
      if (link) setInviteLink(link);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-6 rounded-xl shadow-sm bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-4">
        Invite Coworker
      </h3>
      {inviteLink ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Verification request created. Share or send this link.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-slate-700 dark:text-gray-300"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(
                  typeof window !== "undefined" ? `${window.location.origin}${inviteLink}` : inviteLink
                );
              }}
            >
              Copy
            </Button>
          </div>
          {onClose && (
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="invite-email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Coworker Email
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-slate-900 dark:text-gray-100"
              placeholder="coworker@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="invite-phone"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Coworker Phone
            </label>
            <input
              id="invite-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-slate-900 dark:text-gray-100"
              placeholder="+1 234 567 8900"
            />
          </div>
          <div>
            <label
              htmlFor="invite-company"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Company
            </label>
            <input
              id="invite-company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-slate-900 dark:text-gray-100"
              placeholder="Company name"
            />
          </div>
          <div>
            <label
              htmlFor="invite-role"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
            >
              Role
            </label>
            <input
              id="invite-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-slate-900 dark:text-gray-100"
              placeholder="Job title or role"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || !canSubmit}>
              {submitting ? "Sending…" : "Send Verification Request"}
            </Button>
            {onClose && (
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      )}
    </Card>
  );
}
