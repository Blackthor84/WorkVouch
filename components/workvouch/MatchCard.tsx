"use client";

import { cn } from "@/lib/utils";
import { RequestButton } from "./RequestButton";
import { MatchTrustBadge } from "./MatchTrustBadge";
import { MatchStrengthBadge } from "./MatchStrengthBadge";

export type MatchCardData = {
  id: string;
  matched_user_id: string;
  company_name: string;
  other_job_title: string | null;
  trust_score: number | null;
  match_confidence?: number | null;
  status?: string | null;
  overlap_start?: string;
  overlap_end?: string;
  other_user: {
    id: string;
    full_name: string | null;
    profile_photo_url: string | null;
  } | null;
};

type RequestStatus = "none" | "pending" | "accepted";

export function MatchCard({
  match,
  requestStatus,
  loading,
  onRequestReference,
  onConfirmCoworker,
  confirming,
  onViewProfile,
  className,
}: {
  match: MatchCardData;
  requestStatus: RequestStatus;
  loading: boolean;
  onRequestReference: () => void;
  onConfirmCoworker?: () => void;
  confirming?: boolean;
  onViewProfile?: () => void;
  className?: string;
}) {
  const name = match.other_user?.full_name ?? "Unknown";
  const roleAtCompany = [match.other_job_title || "Employee", match.company_name].filter(Boolean).join(" @ ");
  const overlapRange =
    match.overlap_start && match.overlap_end
      ? `${match.overlap_start} → ${match.overlap_end}`
      : null;
  const score = match.trust_score != null ? Math.round(match.trust_score) : 0;
  const isConfirmed = (match.status ?? "pending") === "confirmed";

  return (
    <article
      className={cn(
        "rounded-2xl bg-white p-6 shadow-md border border-slate-200/80 transition hover:shadow-md",
        className
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-xl text-slate-900 truncate">{name}</p>
            <p className="text-gray-500 text-sm truncate">{roleAtCompany || "—"}</p>
            {overlapRange && (
              <p className="text-xs text-slate-400 mt-0.5">Worked together: {overlapRange}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  isConfirmed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                )}
              >
                {isConfirmed ? "Confirmed ✅" : "Pending"}
              </span>
              <MatchStrengthBadge confidence={match.match_confidence} />
              <MatchTrustBadge score={score} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isConfirmed && onConfirmCoworker && (
            <button
              type="button"
              onClick={onConfirmCoworker}
              disabled={confirming}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              {confirming ? "Confirming…" : "Confirm Coworker"}
            </button>
          )}
          {onViewProfile && (
            <button
              type="button"
              onClick={onViewProfile}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              View Profile
            </button>
          )}
          <RequestButton
            status={requestStatus === "none" ? "default" : requestStatus}
            loading={loading}
            onClick={onRequestReference}
            className="!py-2.5"
          />
        </div>
      </div>
    </article>
  );
}
