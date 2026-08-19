"use client";

import { Star } from "lucide-react";
import { WvCard, WvTrustScore, WvBadge } from "@/components/wv";
import {
  DEMO_EMPLOYEE,
  DEMO_JOB,
  DEMO_REFERENCES,
  formatJobDates,
  type ProductTourJob,
  type ProductTourReference,
} from "@/lib/product-tour/data";
import { cn } from "@/lib/utils";

export function StarRating({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            iconClass,
            star <= rating ? "fill-amber-400 text-amber-400" : "text-wv-border",
          )}
          aria-hidden
        />
      ))}
    </div>
  );
}

type PassportViewProps = {
  jobs: ProductTourJob[];
  references: ProductTourReference[];
  compact?: boolean;
  employerView?: boolean;
};

export function PassportView({ jobs, references, compact, employerView }: PassportViewProps) {
  const initials = DEMO_EMPLOYEE.full_name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="space-y-6">
      <WvCard glow className={compact ? "p-5" : "p-6 sm:p-8"}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-violet-600/20 text-xl font-bold text-blue-300 ring-1 ring-wv-border">
              {initials}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-wv-foreground">{DEMO_EMPLOYEE.full_name}</h2>
              <p className="mt-1 text-wv-muted">{DEMO_EMPLOYEE.headline}</p>
              <p className="mt-1 text-sm text-wv-subtle">
                {DEMO_EMPLOYEE.state}, {DEMO_EMPLOYEE.country}
              </p>
              {employerView && (
                <WvBadge variant="default" className="mt-2">
                  Career Passport
                </WvBadge>
              )}
            </div>
          </div>
          <WvTrustScore score={DEMO_EMPLOYEE.trust_score} size={compact ? "sm" : "md"} />
        </div>
      </WvCard>

      <WvCard className={compact ? "p-5" : "p-6"}>
        <h3 className="text-lg font-semibold text-wv-foreground">Work history</h3>
        {jobs.length === 0 ? (
          <p className="mt-3 text-sm text-wv-muted">No positions added yet.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {jobs.map((job) => (
              <li
                key={job.id}
                className="border-b border-wv-border pb-4 last:border-0 last:pb-0"
              >
                <p className="font-medium text-wv-foreground">{job.job_title}</p>
                <p className="text-sm text-wv-muted">{job.company_name}</p>
                <p className="mt-1 text-xs text-wv-subtle">
                  {formatJobDates(job.start_date, job.end_date)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </WvCard>

      <WvCard className={compact ? "p-5" : "p-6"}>
        <h3 className="text-lg font-semibold text-wv-foreground">
          Peer References ({references.length})
        </h3>
        {references.length === 0 ? (
          <p className="mt-3 text-sm text-wv-muted">No references yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {references.map((ref) => (
              <ReferenceCard key={ref.id} reference={ref} />
            ))}
          </div>
        )}
      </WvCard>
    </div>
  );
}

export function ReferenceCard({
  reference,
  expanded,
  onClick,
}: {
  reference: ProductTourReference;
  expanded?: boolean;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border border-wv-border p-4 text-left transition-colors",
        onClick && "hover:border-wv-brand-blue/40 hover:bg-white/[0.02] cursor-pointer",
        expanded && "border-wv-brand-blue/50 ring-1 ring-wv-brand-blue/20",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-sm font-semibold text-blue-300">
            {reference.reviewerName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-wv-foreground">{reference.reviewerName}</p>
            <p className="text-sm text-wv-muted">{reference.roleLabel}</p>
            {reference.isDirectManager && (
              <span className="mt-1 inline-flex rounded-md bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-300">
                Direct Manager
              </span>
            )}
          </div>
        </div>
        <StarRating rating={reference.rating} size="sm" />
      </div>
      {(expanded || !onClick) && reference.feedback && (
        <p className="mt-3 text-sm leading-relaxed text-wv-muted">{reference.feedback}</p>
      )}
    </Wrapper>
  );
}

export function EmptyPassportPreview() {
  return <PassportView jobs={[]} references={[]} compact />;
}

export function FullPassportPreview() {
  return (
    <PassportView jobs={[DEMO_JOB]} references={DEMO_REFERENCES} />
  );
}
