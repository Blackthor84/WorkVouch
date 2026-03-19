"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

export type CoworkerMatchForCard = {
  id: string;
  matched_user_id: string;
  otherUserId: string;
  company_name: string;
  match_status: string;
  status?: string | null;
  trust_score: number | null;
  match_confidence?: number | null;
  other_user?: { full_name: string | null; profile_photo_url: string | null } | null;
};

export type RequestStatus = "none" | "pending" | "accepted" | "rejected";

export function MatchCard({
  match,
  requestStatus = "none",
  acceptedRequestId = null,
  loading = false,
  onRequestReference,
  onLeaveReference,
  onLeaveReview,
  hasLeftReview = false,
  onViewProfile,
  confirming = false,
  onConfirmCoworker,
  className,
}: {
  match: CoworkerMatchForCard;
  requestStatus?: RequestStatus;
  acceptedRequestId?: string | null;
  loading?: boolean;
  onRequestReference?: () => void;
  onLeaveReference?: (requestId: string) => void;
  /** Direct review per match (coworker_references). Shown when status is accepted/confirmed and no review yet. */
  onLeaveReview?: () => void;
  hasLeftReview?: boolean;
  onViewProfile?: () => void;
  confirming?: boolean;
  onConfirmCoworker?: () => void;
  className?: string;
}) {
  const name = match.other_user?.full_name?.trim() || "Verified Coworker";
  const company = match.company_name || "Same company";
  const status = (match.status ?? match.match_status ?? "pending") as string;
  const confidence = match.match_confidence ?? 0;

  const strengthLabel =
    confidence >= 0.7 ? "High" : confidence >= 0.4 ? "Medium" : "Low";
  const strengthClass =
    strengthLabel === "High"
      ? "bg-emerald-100 text-emerald-800"
      : strengthLabel === "Medium"
        ? "bg-amber-100 text-amber-800"
        : "bg-slate-100 text-slate-600";

  const statusLabel =
    status === "confirmed" || status === "accepted"
      ? "Connected"
      : status === "rejected"
        ? "Declined"
        : "Pending";
  const statusClass =
    statusLabel === "Connected"
      ? "bg-emerald-100 text-emerald-800"
      : statusLabel === "Declined"
        ? "bg-red-100 text-red-800"
        : "bg-amber-100 text-amber-800";

  const trustDisplay =
    match.trust_score != null
      ? `${Number(match.trust_score) / 20 >= 4.5 ? "⭐" : "★"} ${(Number(match.trust_score) / 20).toFixed(1)} / 5`
      : "No score yet";

  return (
    <article
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md",
        className
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-2 ring-slate-200/80">
            {match.other_user?.profile_photo_url ? (
              <img
                src={match.other_user.profile_photo_url}
                alt=""
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <UserCircleIcon className="h-9 w-9" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900 truncate">{name}</p>
            <p className="text-sm text-slate-500 truncate">{company}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  strengthClass
                )}
              >
                {strengthLabel}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  statusClass
                )}
              >
                {statusLabel}
              </span>
            </div>
            <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
              {match.trust_score != null ? (
                <>
                  <StarSolid className="h-3.5 w-3.5 text-amber-500" />
                  {trustDisplay}
                </>
              ) : (
                <span>{trustDisplay}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(onViewProfile != null) ? (
            <button
              type="button"
              onClick={onViewProfile}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              View Profile
            </button>
          ) : (
            <Link
              href={`/employee/${match.matched_user_id}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              View Profile
            </Link>
          )}
          {onRequestReference && requestStatus === "none" && (
            <button
              type="button"
              onClick={onRequestReference}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending…" : "Request Reference"}
            </button>
          )}
          {requestStatus === "pending" && (
            <span className="inline-flex items-center rounded-xl border border-slate-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800">
              Request sent
            </span>
          )}
          {requestStatus === "accepted" && acceptedRequestId && onLeaveReference && (
            <button
              type="button"
              onClick={() => onLeaveReference(acceptedRequestId)}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Leave Reference
            </button>
          )}
          {requestStatus === "accepted" && (!acceptedRequestId || !onLeaveReference) && !hasLeftReview && (
            <span className="inline-flex items-center rounded-xl border border-slate-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800">
              Reference submitted
            </span>
          )}
          {(status === "accepted" || status === "confirmed") && onLeaveReview && !hasLeftReview && (
            <button
              type="button"
              onClick={onLeaveReview}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              👉 Leave Review
            </button>
          )}
          {(status === "accepted" || status === "confirmed") && hasLeftReview && (
            <span className="inline-flex items-center rounded-xl border border-slate-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800">
              Review submitted
            </span>
          )}
          {requestStatus === "rejected" && (
            <span className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-500">
              Request declined
            </span>
          )}
          {onConfirmCoworker && status !== "confirmed" && status !== "accepted" && (
            <button
              type="button"
              onClick={onConfirmCoworker}
              disabled={confirming}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              {confirming ? "Confirming…" : "Confirm Coworker"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
