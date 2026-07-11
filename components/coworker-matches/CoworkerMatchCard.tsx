"use client";

import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { StatusBadge } from "./StatusBadge";
import { WvCard, WvButton, WvBadge } from "@/components/wv";
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
  const strengthVariant = strengthLabel === "Strong" ? "success" : strengthLabel === "Medium" ? "warning" : "default";

  const trustScore =
    match.trust_score != null
      ? Math.round(Number(match.trust_score) / 20)
      : null;

  return (
    <WvCard hover className={cn("animate-in fade-in duration-300", className)}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <Avatar src={match.other_user?.profile_photo_url} name={name} size="lg" />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-wv-foreground truncate">{name}</h3>
            {headline && (
              <p className="text-sm text-wv-muted truncate mt-0.5">{headline}</p>
            )}
          </div>
        </div>

        <p className="text-sm text-wv-muted">
          <span className="font-medium text-wv-foreground">Company:</span> {company}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-wv-subtle">Match Status:</span>
          <StatusBadge status={status} />
          <span className="text-wv-border">|</span>
          <span className="text-xs font-medium text-wv-subtle">Match Strength:</span>
          <WvBadge variant={strengthVariant}>{strengthLabel}</WvBadge>
        </div>

        <div className="text-sm">
          {trustScore != null ? (
            <span className="text-wv-muted">
              Trust Score: <strong className="text-wv-foreground">{trustScore}</strong>
            </span>
          ) : (
            <span className="text-wv-subtle">No trust score yet</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-wv-border">
          <WvButton type="button" variant="outline" size="sm" onClick={onViewProfile}>
            View Profile
          </WvButton>

          {status === "pending" && onConfirm && onDeny && (
            <>
              <WvButton type="button" size="sm" onClick={onConfirm} disabled={confirming}>
                {confirming ? "Accepting…" : "Accept"}
              </WvButton>
              <WvButton type="button" variant="danger" size="sm" onClick={onDeny} disabled={confirming}>
                Deny
              </WvButton>
            </>
          )}

          {(status === "accepted" || status === "confirmed") && (
            <>
              {requestStatus === "none" && onRequestReference && (
                <WvButton type="button" size="sm" onClick={onRequestReference} disabled={loading}>
                  {loading ? "Sending…" : "Request Reference"}
                </WvButton>
              )}
              {requestStatus === "pending" && (
                <WvBadge variant="warning">Request sent</WvBadge>
              )}
              {requestStatus === "accepted" && acceptedRequestId && onLeaveReference && (
                <WvButton type="button" size="sm" onClick={() => onLeaveReference(acceptedRequestId)}>
                  Leave Review
                </WvButton>
              )}
              {requestStatus === "accepted" && !acceptedRequestId && !hasLeftReview && (
                <WvBadge variant="success">Reference submitted</WvBadge>
              )}
              {onLeaveReview && !hasLeftReview && (
                <WvButton type="button" variant="secondary" size="sm" onClick={onLeaveReview}>
                  Leave Review
                </WvButton>
              )}
              {hasLeftReview && <WvBadge variant="success">Review submitted</WvBadge>}
              {requestStatus === "rejected" && (
                <WvBadge variant="default">Request declined</WvBadge>
              )}
            </>
          )}
        </div>
      </div>
    </WvCard>
  );
}
