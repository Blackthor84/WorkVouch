"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TrustScoreBadge } from "@/components/employer/TrustScoreBadge";
import { recordCandidateProfileView } from "@/lib/actions/employer/employerDashboardStats";
import type { CandidateProfileData } from "@/lib/actions/employer/getCandidateProfile";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

export function CandidateProfileView({
  candidate,
  candidateId,
  viewerIsEmployer,
  viewerIsPremium,
  locked,
  viewsToday = 0,
  viewLimit = 5,
}: {
  candidate: CandidateProfileData;
  candidateId: string;
  viewerIsEmployer: boolean;
  viewerIsPremium: boolean;
  locked?: boolean;
  viewsToday?: number;
  viewLimit?: number;
}) {
  const name = candidate.full_name ?? "Candidate";
  const refCount = candidate.reference_count ?? candidate.references?.length ?? 0;

  useEffect(() => {
    if (viewerIsEmployer && !locked && candidateId) {
      recordCandidateProfileView(candidateId).catch(() => {});
    }
  }, [viewerIsEmployer, locked, candidateId]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl">
        {locked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-slate-900/85 backdrop-blur-sm p-6 text-center">
            <p className="text-lg font-semibold text-white mb-2">Unlock full trust insights</p>
            <p className="text-slate-300 text-sm mb-2 max-w-sm">
              You've used {viewsToday} of {viewLimit} free profile views today.
            </p>
            <p className="text-slate-400 text-sm mb-6 max-w-sm">
              Upgrade for unlimited access, full references, and trust scores.
            </p>
            <UnlockCandidatesButton />
          </div>
        )}

        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{name}</h1>
          {candidate.headline && (
            <p className="mt-1 text-slate-600 font-medium">{candidate.headline}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <TrustScoreBadge score={candidate.trust_score} size="lg" blur={locked} />
            {refCount > 0 && !locked && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
                Verified by {refCount} coworker{refCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </header>

        {candidate.bio && (
          <section className={cn("mb-6", locked && "blur-sm pointer-events-none select-none")}>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Bio</h2>
            <p className="text-slate-700 whitespace-pre-wrap">{candidate.bio}</p>
          </section>
        )}

        <section className={cn("mb-8", locked && "blur-sm pointer-events-none select-none")}>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Work history</h2>
          {candidate.jobs.length === 0 ? (
            <p className="text-slate-500 text-sm">No public job history.</p>
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
          {!candidate.references?.length ? (
            <p className="text-slate-500 text-sm">No references yet.</p>
          ) : (
            <ul className="space-y-4">
              {candidate.references.map((ref, i) => (
                <li key={i} className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="flex items-center gap-1 text-amber-600">
                      {Array.from({ length: ref.rating }, (_, j) => (
                        <StarSolid key={j} className="h-5 w-5" />
                      ))}
                    </span>
                    <span className="text-sm font-medium text-slate-700">{ref.author_name ?? "A coworker"}</span>
                    {ref.company_name && (
                      <span className="text-sm text-slate-500">@ {ref.company_name}</span>
                    )}
                  </div>
                  {ref.feedback && <p className="text-slate-700 text-sm whitespace-pre-wrap">{ref.feedback}</p>}
                  <p className="text-xs text-slate-400 mt-1">{new Date(ref.created_at).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <Link
            href={viewerIsEmployer ? "/employer" : "/coworker-matches"}
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Back
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
