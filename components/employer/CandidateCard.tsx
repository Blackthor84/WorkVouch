"use client";

import { useState } from "react";
import { TrustScoreBadge } from "./TrustScoreBadge";
import { TrustRankInlineBadge } from "@/components/trust/TrustRankInlineBadge";
import { saveCandidate, unsaveCandidate } from "@/lib/actions/employer/saved-candidates";
import { Bookmark, Star } from "lucide-react";
import { WvCard, WvButton } from "@/components/wv";
import { SmartInsight } from "@/components/guidance/SmartInsight";
import { SuggestedActions } from "@/components/guidance/SuggestedActions";
import { TrustScoreHint } from "@/components/guidance/TrustMetricHints";

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
    <WvCard hover className={className}>
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
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500/20 to-violet-600/20 text-blue-300 font-semibold flex items-center justify-center flex-shrink-0 ring-1 ring-wv-border">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h3 className="text-lg font-semibold text-wv-foreground truncate">{name}</h3>
              {!blurTrust && (
                <TrustRankInlineBadge score={candidate.trust_score} reviewCount={refCount} className="shrink-0" />
              )}
            </div>
            {headline && <p className="text-sm text-wv-muted truncate mt-0.5">{headline}</p>}
            <p className="text-sm text-wv-muted mt-0.5">
              <span className="font-medium text-wv-foreground">Company:</span> {company}
            </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 max-w-[200px]">
            <span className="text-xs text-wv-subtle flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
              Trust score
            </span>
            <TrustScoreBadge
              score={candidate.trust_score}
              referenceCount={refCount}
              size="lg"
              blur={blurTrust}
            />
            {!blurTrust && <TrustScoreHint className="text-right" />}
          </div>
        </div>
        {!blurTrust && (
          <div className="space-y-3 pt-1 border-t border-wv-border">
            <SmartInsight
              trustScore={candidate.trust_score}
              referenceCount={refCount}
              verifiedCoworkerCount={coworkerVerified}
              compact
            />
            <SuggestedActions
              trustScore={candidate.trust_score}
              referenceCount={refCount}
              verifiedCoworkerCount={coworkerVerified}
              candidateId={candidate.id}
              compact
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3 text-sm text-wv-muted">
          {coworkerVerified > 0 && (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <span aria-hidden>✔</span>
              Verified by {coworkerVerified} coworker{coworkerVerified !== 1 ? "s" : ""}
            </span>
          )}
          {refCount > 0 && (
            <span className="inline-flex items-center gap-1 text-wv-subtle">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
              {refCount} reference{refCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {blurTrust && (
          <p className="text-xs text-blue-400 font-medium">Upgrade to unlock exact trust data →</p>
        )}
        <div className="flex flex-wrap gap-2">
          <WvButton href={`/employer/profile/${candidate.id}`} size="sm">
            View Profile
          </WvButton>
          <WvButton
            type="button"
            variant={isSaved ? "secondary" : "outline"}
            size="sm"
            onClick={handleSaveToggle}
            disabled={saving}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} aria-hidden />
            {saving ? "…" : isSaved ? "Saved" : "Save Candidate"}
          </WvButton>
        </div>
      </div>
    </WvCard>
  );
}
