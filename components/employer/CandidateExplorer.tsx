"use client";

import { useState } from "react";
import Link from "next/link";
import type { EmployerCandidateRow } from "@/lib/actions/employer/employerCandidateSearch";

type Props = {
  candidates: EmployerCandidateRow[];
  loading: boolean;
  selectedIds: string[];
  onToggleSelect: (candidateId: string) => void;
  employerId?: string | null;
  requestedCandidateIds: Set<string>;
  onResumeRequestComplete: () => void;
};

/**
 * Card grid of candidates (name, trust, headline); cards toggle compare selection.
 */
export function CandidateExplorer({
  candidates,
  loading,
  selectedIds,
  onToggleSelect,
  employerId,
  requestedCandidateIds,
  onResumeRequestComplete,
}: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  async function requestResume(candidateId: string) {
    setBanner(null);
    if (!employerId) {
      setBanner({
        type: "err",
        text: "Employer account not linked. Complete employer setup to request resumes.",
      });
      return;
    }
    setBusyId(candidateId);
    try {
      const res = await fetch("/api/employer/resume-requests", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBanner({
          type: "err",
          text: typeof data.error === "string" ? data.error : "Request failed",
        });
        return;
      }
      setBanner({
        type: "ok",
        text:
          data.duplicate === true
            ? data.message ?? "You already requested access for this candidate."
            : "Resume access request sent. We’ll notify the candidate.",
      });
      onResumeRequestComplete();
    } catch {
      setBanner({ type: "err", text: "Request failed. Try again." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900/40">
      <h3 className "text-lg font-semibold text-grey-dark dark:text-gray-200">
        Browse candidates
      </h3>
      <p className="text-sm text-grey-medium dark:text-gray-400 mt-1">
        Click a card to include it in the comparison (up to two). Open full profile
        from the link on each card.
      </p>

      {banner && (
        <div
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            banner.type === "ok"
              ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200"
              : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200"
          }`}
          role="status"
        >
          {banner.text}
        </div>
      )}

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center dark:border-gray-700 dark:bg-gray-950/30">
          <p className="text-sm text-grey-medium dark:text-gray-400">
            No candidates match this trust filter. Lower the minimum or check back
            later.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c) => {
            const selected = selectedIds.includes(c.id);
            return (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => onToggleSelect(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggleSelect(c.id);
                  }
                }}
                className={`cursor-pointer rounded-xl border p-4 text-left shadow-sm transition-all hover:shadow-md dark:bg-gray-950/30 ${
                  selected
                    ? "border-blue-500 ring-2 ring-blue-200 dark:border-blue-400 dark:ring-blue-900/50"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <p className="font-semibold text-grey-dark dark:text-gray-100 line-clamp-1">
                  {c.full_name ?? "Candidate"}
                </p>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300 tabular-nums">
                  Trust {c.trust_score}/100
                </p>
                {c.headline ? (
                  <p className="mt-2 text-sm text-grey-medium dark:text-gray-400 line-clamp-2">
                    {c.headline}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href={`/employer/profile/${c.id}`}
                    className="text-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View profile
                  </Link>
                  <button
                    type="button"
                    disabled={
                      !employerId ||
                      busyId === c.id ||
                      requestedCandidateIds.has(c.id)
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      void requestResume(c.id);
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-grey-dark hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    {requestedCandidateIds.has(c.id)
                      ? "Request pending"
                      : busyId === c.id
                        ? "Sending…"
                        : "Request resume access"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
