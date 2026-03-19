"use client";

import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { StatusBadge } from "./StatusBadge";
import type { EmploymentMatchRow } from "@/lib/actions/employmentMatches";

type Props = {
  match: EmploymentMatchRow;
  requestStatus: "none" | "pending" | "accepted" | "rejected";
  acceptedRequestId: string | null;
  hasLeftReview: boolean;
  loading?: boolean;
  confirming?: boolean;
  onViewProfile: () => void;
  onLeaveReview?: () => void;
  onLeaveReference?: (requestId: string) => void;
  onRequestReference?: () => void;
  onConfirm?: () => void;
  onDeny?: () => void;
  className?: string;
};

export function CoworkerMatchCard({
  match,
  requestStatus,
  acceptedRequestId,
  hasLeftReview,
  loading = false,
  confirming = false,
  onViewProfile,
  onLeaveReview,
  onLeaveReference,
  onRequestReference,
  onConfirm,
  onDeny,
  className,
}: Props) {
  const name = match.other_user?.full_name?.trim() || "Coworker";
  const headline = match.other_user?.headline?.trim() || null;
  const company = match.company_name || "Same company";
  const status = (match.status ?? match.match_status ?? "pending") as string;
  const confidence = match.match_confidence ?? 0;
  const strengthLabel = confidence >= 0.7 ? "Strong" : confidence >= 0.4 ? "Medium" : "Weak";
  const strengthClass =
    strengthLabel === "Strong"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
      : strengthLabel === "Medium"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
        : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";

  const trustScore =
    match.trust_score != null
      ? Math.round(Number(match.trust_score) / 20)
      : null;

  return (
    <article
      className={cn(
        "rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/50 p-6 shadow-md",
        "transition-all duration-200 hover:shadow-lg hover:scale-[1.01]",
        "animate-in fade-in duration-300",
        className
      )}
    >
      <div className="flex flex-col gap-4">
        {/* Top: Avatar + Name + Headline */}
        <div className="flex gap-4">
          <Avatar
            src={match.other_user?.profile_photo_url}
            name={name}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">
              {name}
            </h3>
            {headline && (
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {headline}
              </p>
            )}
          </div>
        </div>

        {/* Company */}
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-700 dark:text-slate-200">Company:</span>{" "}
          {company}
        </p>

        {/* Badges: Match Status + Match Strength */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Match Status:
          </span>
          <StatusBadge status={status} />
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Match Strength:
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              strengthClass
            )}
          >
            {strengthLabel}
          </span>
        </div>

        {/* Trust preview */}
        <div className="text-sm">
          {trustScore != null ? (
            <span className="text-slate-600 dark:text-slate-300">
              ⭐ Trust Score: <strong>{trustScore}</strong>
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">
              No trust score yet
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onViewProfile}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            View Profile
          </button>

          {status === "pending" && onConfirm && onDeny && (
            <>
              <button
                type="button"
                onClick={onConfirm}
                disabled={confirming}
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {confirming ? "Accepting…" : "Accept"}
              </button>
              <button
                type="button"
                onClick={onDeny}
                disabled={confirming}
                className="inline-flex items-center justify-center rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
              >
                Deny
              </button>
            </>
          )}

          {(status === "accepted" || status === "confirmed") && (
            <>
              {requestStatus === "none" && onRequestReference && (
                <button
                  type="button"
                  onClick={onRequestReference}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 transition-colors hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50"
                >
                  {loading ? "Sending…" : "Request Reference"}
                </button>
              )}
              {requestStatus === "pending" && (
                <span className="inline-flex items-center rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-4 py-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                  Request sent
                </span>
              )}
              {requestStatus === "accepted" && acceptedRequestId && onLeaveReference && (
                <button
                  type="button"
                  onClick={() => onLeaveReference(acceptedRequestId)}
                  className="inline-flex items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 transition-colors hover:bg-slate-800 dark:hover:bg-slate-200"
                >
                  Leave Review
                </button>
              )}
              {requestStatus === "accepted" && !acceptedRequestId && !hasLeftReview && (
                <span className="inline-flex items-center rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  Reference submitted
                </span>
              )}
              {onLeaveReview && !hasLeftReview && (
                <button
                  type="button"
                  onClick={onLeaveReview}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  Leave Review
                </button>
              )}
              {hasLeftReview && (
                <span className="inline-flex items-center rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-2 text-sm font-medium text-emerald-800 dark:text-emerald-200">
                  Review submitted
                </span>
              )}
              {requestStatus === "rejected" && (
                <span className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  Request declined
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
