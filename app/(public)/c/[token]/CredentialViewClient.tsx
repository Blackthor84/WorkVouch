"use client";

import { useState, useEffect } from "react";

interface CredentialPayload {
  version: 1;
  issuedAt: string;
  workHistory: { companyName: string; jobTitle: string; startDate: string; endDate: string | null; isCurrent: boolean; verificationStatus: string }[];
  trustScore: number;
  confidenceScore: number;
  industry?: string;
  verifiedEmploymentSummary?: { totalRoles: number; verifiedRoles: number; verificationCoveragePct: number };
  trustBand?: string;
  trustTrajectory?: string;
  trustTrajectoryLabel?: string;
  verificationCoveragePct?: number;
}

export function CredentialViewClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [credential, setCredential] = useState<{ payload: CredentialPayload; issued_at: string; expires_at: string | null } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/credential?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError((data as { error?: string }).error ?? "Credential unavailable");
          setLoading(false);
          return;
        }
        const c = (data as { credential?: { payload: CredentialPayload; issued_at: string; expires_at: string | null } }).credential;
        if (c) setCredential(c);
        else setError("Credential not found");
      } catch {
        if (!cancelled) setError("Failed to load credential");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-b-transparent dark:border-blue-400" />
          <p className="mt-4 text-slate-600 dark:text-slate-400">Loading credential…</p>
        </div>
      </div>
    );
  }

  if (error || !credential) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-8 max-w-md text-center">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Credential unavailable</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">{error ?? "Not found"}</p>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
            This link may have expired or been revoked.
          </p>
        </div>
      </div>
    );
  }

  const p = credential.payload;
  const issued = new Date(credential.issued_at).toLocaleDateString(undefined, { dateStyle: "medium" });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {/* Header */}
          <div className="bg-slate-100 dark:bg-slate-800/50 px-6 py-5 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-lg">
                WV
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">WorkVouch Credential</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Verified employment. Portable trust.</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">Issued {issued}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* Trust summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Reputation score</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{p.trustScore}</p>
              </div>
              {p.trustBand != null && p.trustBand !== "" && (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Trust band</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{p.trustBand}</p>
                </div>
              )}
              {p.trustTrajectoryLabel != null && p.trustTrajectoryLabel !== "" && (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Trajectory</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{p.trustTrajectoryLabel}</p>
                </div>
              )}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Verification coverage</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {p.verificationCoveragePct != null ? `${p.verificationCoveragePct}%` : p.verifiedEmploymentSummary ? `${p.verifiedEmploymentSummary.verificationCoveragePct}%` : "—"}
                </p>
              </div>
            </div>

            {/* Verified employment summary */}
            {p.verifiedEmploymentSummary && (
              <div>
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Verified employment summary</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {p.verifiedEmploymentSummary.verifiedRoles} of {p.verifiedEmploymentSummary.totalRoles} roles verified
                  {p.verifiedEmploymentSummary.verificationCoveragePct != null && ` (${p.verifiedEmploymentSummary.verificationCoveragePct}% coverage)`}.
                </p>
              </div>
            )}

            {/* Work history */}
            <div>
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Work history</h2>
              {p.workHistory && p.workHistory.length > 0 ? (
                <ul className="space-y-3">
                  {p.workHistory.map((job, i) => (
                    <li key={i} className="flex justify-between items-start gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{job.jobTitle}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{job.companyName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                          {job.startDate} – {job.isCurrent ? "Present" : (job.endDate ?? "—")}
                        </p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded ${
                        job.verificationStatus === "verified"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : job.verificationStatus === "matched"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                      }`}>
                        {job.verificationStatus}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-500">No work history in this credential.</p>
              )}
            </div>

            {p.industry && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">Industry:</span> {p.industry.replace(/_/g, " ")}
              </p>
            )}
          </div>

          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-500">
              This credential is verifiable and time-limited.
              <br />
              Powered by WorkVouch.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
