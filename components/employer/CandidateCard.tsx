"use client";

import { useState } from "react";
import Link from "next/link";
import { TrustScoreBadge } from "./TrustScoreBadge";
import { saveCandidate, unsaveCandidate } from "@/lib/actions/employer/saved-candidates";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid, BookmarkIcon as BookmarkSolid } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

export type CandidateCardData = {
  id: string;
  full_name: string | null;
  headline?: string | null;
  trust_score: number;
  reference_count?: number;
  jobs: Array<{ company_name: string; job_title: string | null; start_date: string; end_date: string | null }>;
};

export function CandidateCard({
  candidate,
  isSaved = false,
  onSavedChange,
  className,
}: {
  candidate: CandidateCardData;
  isSaved?: boolean;
  onSavedChange?: () => void;
  className?: string;
}) {
  const [saving, setSaving] = useState(false);
  const name = candidate.full_name ?? "Candidate";
  const latestJob = candidate.jobs[0];
  const company = latestJob?.company_name ?? "—";
  const headline = candidate.headline ?? null;
  const refCount = candidate.reference_count ?? 0;

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
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-slate-900 truncate">{name}</h3>
            {headline && <p className="text-sm text-slate-600 truncate mt-0.5">{headline}</p>}
            <p className="text-sm text-slate-500 mt-0.5">{company}</p>
          </div>
          <TrustScoreBadge score={candidate.trust_score} size="lg" />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          {refCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <StarSolid className="h-4 w-4 text-amber-500" />
              {refCount} reference{refCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/candidate/${candidate.id}`}
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
