"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { TrustScoreBadge } from "@/components/employer/TrustScoreBadge";
import { TrustRankInlineBadge } from "@/components/trust/TrustRankInlineBadge";
import { recordCandidateProfileView } from "@/lib/actions/employer/employerDashboardStats";
import type { CandidateProfileData } from "@/lib/actions/employer/getCandidateProfile";
import {
  WvContainer,
  WvCard,
  WvButton,
  WvBadge,
  WvEmptyState,
} from "@/components/wv";
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
  const refCount =
    candidate.reference_count ??
    candidate.references?.length ??
    0;

  useEffect(() => {
    if (viewerIsEmployer && !locked && candidateId) {
      recordCandidateProfileView(candidateId).catch(() => {});
    }
  }, [viewerIsEmployer, locked, candidateId]);

  return (
    <WvContainer size="narrow" className="py-8">
      <WvCard glow padding="lg" className="relative">
        {locked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-wv-bg/90 backdrop-blur-sm p-6 text-center">
            <p className="mb-2 text-lg font-semibold text-wv-foreground">Unlock full trust insights</p>
            <p className="mb-2 max-w-sm text-sm text-wv-muted">
              You&apos;ve used {viewsToday} of {viewLimit} free profile views today.
            </p>
            <p className="mb-6 max-w-sm text-sm text-wv-subtle">
              Upgrade for unlimited access, full references, and trust scores.
            </p>
            <UnlockCandidatesButton />
          </div>
        )}

        <header className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-wv-brand-blue/90">
            Candidate profile
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-wv-foreground sm:text-3xl">{name}</h1>
            {!locked && (
              <TrustRankInlineBadge score={candidate.trust_score} reviewCount={refCount} />
            )}
          </div>
          {candidate.headline && (
            <p className="mt-1 font-medium text-wv-muted">{candidate.headline}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <TrustScoreBadge
              score={candidate.trust_score}
              referenceCount={refCount}
              size="lg"
              blur={locked}
            />
            {refCount > 0 && !locked && (
              <WvBadge variant="success">
                Verified by {refCount} coworker{refCount !== 1 ? "s" : ""}
              </WvBadge>
            )}
          </div>
        </header>

        {candidate.bio && (
          <section className={cn("mb-6", locked && "pointer-events-none select-none blur-sm")}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-wv-subtle">Bio</h2>
            <p className="whitespace-pre-wrap text-wv-muted">{candidate.bio}</p>
          </section>
        )}

        <section className={cn("mb-8", locked && "pointer-events-none select-none blur-sm")}>
          <h2 className="mb-4 text-lg font-semibold text-wv-foreground">Work history</h2>
          {candidate.jobs.length === 0 ? (
            <WvEmptyState
              compact
              title="No public job history"
              description="This candidate hasn't shared verified employment yet."
            />
          ) : (
            <ul className="space-y-3">
              {candidate.jobs.map((job, i) => (
                <li key={i} className="rounded-xl border border-wv-border bg-wv-surface/60 p-4">
                  <p className="font-medium text-wv-foreground">{job.company_name}</p>
                  <p className="text-sm text-wv-muted">{job.job_title ?? "—"}</p>
                  <p className="mt-1 text-xs text-wv-subtle">
                    {job.start_date} – {job.end_date ?? "Present"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={cn("mb-6", locked && "pointer-events-none select-none blur-sm")}>
          <h2 className="mb-4 text-lg font-semibold text-wv-foreground">References</h2>
          {!candidate.references?.length ? (
            <WvEmptyState
              compact
              title="No references yet"
              description="Coworker verifications will appear here when available."
            />
          ) : (
            <ul className="space-y-3">
              {candidate.references.map((ref, i) => (
                <li key={i} className="rounded-xl border border-wv-border bg-wv-surface/60 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: ref.rating }, (_, j) => (
                        <Star key={j} className="h-4 w-4 fill-current" />
                      ))}
                    </span>
                    <span className="text-sm font-medium text-wv-foreground">
                      {ref.author_name ?? "A coworker"}
                    </span>
                    {ref.company_name && (
                      <span className="text-sm text-wv-muted">@ {ref.company_name}</span>
                    )}
                  </div>
                  {ref.feedback && (
                    <p className="whitespace-pre-wrap text-sm text-wv-muted">{ref.feedback}</p>
                  )}
                  <p className="mt-1 text-xs text-wv-subtle">
                    {new Date(ref.created_at).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-wrap gap-3 border-t border-wv-border pt-4">
          <WvButton
            href={viewerIsEmployer ? "/employer/dashboard" : "/coworker-matches"}
            variant="outline"
            size="sm"
          >
            Back
          </WvButton>
          {locked && <UnlockCandidatesButton />}
        </div>
      </WvCard>
    </WvContainer>
  );
}

function UnlockCandidatesButton() {
  return (
    <WvButton
      size="sm"
      onClick={() => window.dispatchEvent(new CustomEvent("workvouch-open-upgrade"))}
    >
      Unlock candidates
    </WvButton>
  );
}
