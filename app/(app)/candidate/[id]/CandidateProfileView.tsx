"use client";

import Link from "next/link";
import { TrustScoreBadge } from "@/components/employer/TrustScoreBadge";
import type { CandidateProfileData } from "@/lib/actions/employer/getCandidateProfile";
import { cn } from "@/lib/utils";

export function CandidateProfileView({
  candidate,
  viewerIsEmployer,
  viewerIsPremium,
}: {
  candidate: CandidateProfileData;
  viewerIsEmployer: boolean;
  viewerIsPremium: boolean;
}) {
  const locked = viewerIsEmployer && !viewerIsPremium;
  const name = candidate.full_name ?? "Candidate";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md">
        {locked && (
          <div
            className={cn(
              "absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-slate-900/80 backdrop-blur-sm p-6 text-center"
            )}
          >
            <p className="text-lg font-semibold text-white mb-2">Upgrade to view full verified work history</p>
            <p className="text-slate-300 text-sm mb-6 max-w-sm">
              Unlock candidate profiles, full job history, and trust details.
            </p>
            <UnlockCandidatesButton />
          </div>
        )}

        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">{name}</h1>
          <div className="mt-2">
            <TrustScoreBadge score={candidate.trust_score} size="lg" blur={locked} />
            {!locked && candidate.trust_score > 70 && (
              <span className="ml-3 inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                Verified
              </span>
            )}
          </div>
        </header>

        <section className={cn("mb-8", locked && "blur-sm pointer-events-none select-none")}>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Job history</h2>
          {candidate.jobs.length === 0 ? (
            <p className="text-gray-500 text-sm">No public job history.</p>
          ) : (
            <ul className="space-y-4">
              {candidate.jobs.map((job, i) => (
                <li key={i} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <p className="font-medium text-slate-900">{job.company_name}</p>
                  <p className="text-sm text-slate-600">{job.job_title ?? "—"}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {job.start_date} – {job.end_date ?? "Present"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={cn("mb-6", locked && "blur-sm pointer-events-none select-none")}>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">References</h2>
          <p className="text-gray-500 text-sm">Coming soon — coworker references and verification.</p>
        </section>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <Link
            href="/dashboard/employer"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to search
          </Link>
          {locked && <UnlockCandidatesButton />}
        </div>
      </div>
    </div>
  );
}

function UnlockCandidatesButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("workvouch-open-upgrade"))}
      className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100"
    >
      Unlock Candidates
    </button>
  );
}
