"use client";

import Link from "next/link";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { MatchCardData } from "./MatchCard";

export function MatchProfileModal({
  match,
  onClose,
}: {
  match: MatchCardData;
  onClose: () => void;
}) {
  const name = match.other_user?.full_name ?? "Unknown";
  const roleAtCompany = [match.other_job_title || "Employee", match.company_name].filter(Boolean).join(" @ ");
  const overlapRange =
    match.overlap_start && match.overlap_end
      ? `${match.overlap_start} – ${match.overlap_end}`
      : null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-profile-title"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="match-profile-title" className="text-xl font-semibold text-slate-900">
            Profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Name</p>
            <p className="text-slate-900 font-medium">{name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Company & role</p>
            <p className="text-slate-700">{roleAtCompany || "—"}</p>
          </div>
          {overlapRange && (
            <div>
              <p className="text-sm font-medium text-slate-500">Worked together</p>
              <p className="text-slate-700">{overlapRange}</p>
            </div>
          )}
        </div>
        <div className="mt-8 flex gap-3">
          <Link
            href={`/employee/${match.matched_user_id}`}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
          >
            View full profile
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
