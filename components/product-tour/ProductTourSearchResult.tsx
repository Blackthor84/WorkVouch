"use client";

import { Star } from "lucide-react";
import { WvCard, WvButton, WvBadge } from "@/components/wv";
import { TrustScoreBadge } from "@/components/employer/TrustScoreBadge";
import { DEMO_EMPLOYEE, DEMO_JOB, DEMO_REFERENCES } from "@/lib/product-tour/data";

/** Search result card for the product tour — mirrors employer search UI without live routes. */
export function ProductTourSearchResult() {
  const refCount = DEMO_REFERENCES.length;

  return (
    <WvCard className="max-w-xl">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3 min-w-0 flex-1">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-violet-600/20 text-lg font-semibold text-blue-300 ring-1 ring-wv-border">
              {DEMO_EMPLOYEE.full_name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-wv-foreground truncate">
                {DEMO_EMPLOYEE.full_name}
              </h3>
              <p className="text-sm text-wv-muted truncate mt-0.5">{DEMO_EMPLOYEE.headline}</p>
              <p className="text-sm text-wv-muted mt-0.5">
                <span className="font-medium text-wv-foreground">Company:</span>{" "}
                {DEMO_JOB.company_name}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-wv-subtle flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
              Trust score
            </span>
            <TrustScoreBadge
              score={DEMO_EMPLOYEE.trust_score}
              referenceCount={refCount}
              size="lg"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-wv-muted border-t border-wv-border pt-3">
          {refCount > 0 && (
            <span className="inline-flex items-center gap-1 text-wv-subtle">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
              {refCount} reference{refCount !== 1 ? "s" : ""}
            </span>
          )}
          <WvBadge variant="default">{DEMO_EMPLOYEE.state}</WvBadge>
        </div>

        <WvButton type="button" size="sm" className="w-fit">
          View profile
        </WvButton>
      </div>
    </WvCard>
  );
}
