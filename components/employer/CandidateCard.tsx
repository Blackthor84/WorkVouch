"use client";

import { useState } from "react";
import Link from "next/link";
import { TrustScoreBadge } from "./TrustScoreBadge";
import { TrustRankInlineBadge } from "@/components/trust/TrustRankInlineBadge";
import { saveCandidate, unsaveCandidate } from "@/lib/actions/employer/saved-candidates";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid, BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

export type CandidateCardData = {
  id: string;
  full_name: string | null;
  headline?: string | null;
  profile_photo_url?: string | null;
  trust_score: number;
  reference_count?: number;
  verified_coworker_count?: number;
  jobs: Array<{ company_name: string; job_title: string | null; start_date: string; end_date: string | null }>;
};

export function CandidateCard({
  candidate,
  isSaved = false,
  onSavedChange,
  className,
  blurTrust = false,
}: {
  candidate: CandidateCardData;
  isSaved?: boolean;
  onSavedChange?: () => void;
  className?: string;
  blurTrust?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const name = candidate.full_name ?? "Candidate";
  const latestJob = candidate.jobs[0];
  const company = latestJob?.company_name ?? "—";
  const headline = candidate.headline ?? null;
  const refCount = candidate.reference_count ?? 0;
  const coworkerVerified = candidate.verified_coworker_count ?? 0;

  async function handleSaveToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;
    setSaving(true);
    try {
      if (isSaved) {
        await unsaveCandidate(candidate.id);
      } else {
        await saveCandidate(candidate.id);
      }
      onSavedChange?.();
    } finally {
      setSaving(false);
    }
  }

  return (
    <article
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md",
        className
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3 min-w-0 flex-1">
            {candidate.profile_photo_url ? (
              <img
                src={candidate.profile_photo_url}
                alt=""
                className="h-14 w-14 rounded-full object-cover border border-slate-200 flex-shrink-0"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center flex-shrink-0">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 truncate">{name}</h3>
              {!blurTrust && (
                <TrustRankInlineBadge score={candidate.trust_score} reviewCount={refCount} className="shrink-0" />
              )}
            </div>
            {headline && <p className="text-sm text-slate-600 truncate mt-0.5">{headline}</p>}
            <p className="text-sm text-slate-500 mt-0.5">
              <span className="font-medium text-slate-700">Company:</span> {company}
            </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <StarSolid className="h-3.5 w-3.5 text-amber-500" />
              Trust score
            </span>
            <TrustScoreBadge
              score={candidate.trust_score}
              referenceCount={refCount}
              size="lg"
              blur={blurTrust}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          {coworkerVerified > 0 && (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <span aria-hidden>✔</span>
              Verified by {coworkerVerified} coworker{coworkerVerified !== 1 ? "s" : ""}
            </span>
          )}
          {refCount > 0 && (
            <span className="inline-flex items-center gap-1 text-slate-500">
              <StarSolid className="h-4 w-4 text-amber-500" />
              {refCount} reference{refCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {blurTrust && (
          <p className="text-xs text-blue-700 font-medium">Upgrade to unlock exact trust data →</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/employer/profile/${candidate.id}`}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            View Profile
          </Link>
          <button
            type="button"
            onClick={handleSaveToggle}
            disabled={saving}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
              isSaved
                ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
          >
            {isSaved ? <BookmarkSolid className="h-4 w-4" /> : <BookmarkIcon className="h-4 w-4" />}
            {saving ? "…" : isSaved ? "Saved" : "Save Candidate"}
          </button>
        </div>
      </div>
    </article>
  );
}
