"use client";

import { cn } from "@/lib/utils";
import { RequestButton } from "./RequestButton";
import { MatchTrustBadge } from "./MatchTrustBadge";

export type MatchCardData = {
  id: string;
  matched_user_id: string;
  company_name: string;
  other_job_title: string | null;
  trust_score: number | null;
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
  className,
}: {
  match: MatchCardData;
  requestStatus: RequestStatus;
  loading: boolean;
  onRequestReference: () => void;
  className?: string;
}) {
  const name = match.other_user?.full_name ?? "Unknown";
  const roleAtCompany = [match.other_job_title || "Employee", match.company_name].filter(Boolean).join(" @ ");
  const overlapRange =
    match.overlap_start && match.overlap_end
      ? `${match.overlap_start} → ${match.overlap_end}`
      : null;
  const score = match.trust_score != null ? Math.round(match.trust_score) : 0;

  return (
    <article
      className={cn(
        "rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 transition hover:shadow-md",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-bold text-lg text-slate-900 truncate">{name}</p>
          <p className="text-slate-500 text-sm truncate">{roleAtCompany || "—"}</p>
          {overlapRange && (
            <p className="text-xs text-slate-400 mt-0.5">{overlapRange}</p>
          )}
          <div className="mt-2">
            <MatchTrustBadge score={score} />
          </div>
        </div>
        <div className="shrink-0 w-full sm:w-auto">
          <RequestButton
            status={requestStatus === "none" ? "default" : requestStatus}
            loading={loading}
            onClick={onRequestReference}
            className="w-full sm:w-auto !py-2.5"
          />
        </div>
      </div>
    </article>
  );
}
