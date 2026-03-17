"use client";

import { cn } from "@/lib/utils";
import { RequestButton } from "./RequestButton";

export type MatchCardData = {
  id: string;
  matched_user_id: string;
  company_name: string;
  other_job_title: string | null;
  trust_score: number | null;
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
  const subtitle = [match.company_name, match.other_job_title].filter(Boolean).join(" • ");
  const trustDisplay = match.trust_score != null ? Math.round(match.trust_score) : "—";

  return (
    <article
      className={cn(
        "rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md",
        className
      )}
    >
      <div className="flex justify-between items-center">
        <div className="min-w-0">
          <p className="font-semibold text-lg text-slate-900 truncate">{name}</p>
          <p className="text-gray-500 text-sm truncate">{subtitle || "—"}</p>
        </div>
        <span className="text-sm font-medium bg-gray-100 text-slate-700 px-3 py-1 rounded-full shrink-0 ml-3">
          Score: {trustDisplay}
        </span>
      </div>

      <div className="mt-4 w-full">
        <RequestButton
          status={requestStatus === "none" ? "default" : requestStatus}
          loading={loading}
          onClick={onRequestReference}
          className="w-full !py-2.5"
        />
      </div>
    </article>
  );
}
