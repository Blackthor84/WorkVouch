"use client";

import type { HiringConfidenceResult } from "@/lib/trust/confidence/types";
import { renderStarRating } from "@/lib/trust/confidence/ConfidenceLevelResolver";
import { ghPanel } from "./panel-theme";

interface HiringConfidenceHeroProps {
  confidence: HiringConfidenceResult;
}

export function HiringConfidenceHero({ confidence }: HiringConfidenceHeroProps) {
  return (
    <section
      className={`${ghPanel.card} ${ghPanel.cardPadding}`}
      aria-labelledby="wv-confidence-heading"
    >
      <p id="wv-confidence-heading" className="text-xs font-semibold uppercase tracking-wide text-[#047957]">
        Hiring Confidence
      </p>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p
            className="text-4xl font-bold tabular-nums text-[#15372c]"
            aria-label={`Hiring confidence ${confidence.confidenceScore} percent`}
          >
            {confidence.confidenceScore}%
          </p>
          <p className="mt-1 text-sm text-[#047957]" aria-label={`${confidence.starRating} out of 5 stars`}>
            {renderStarRating(confidence.starRating)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[#15372c]">{confidence.confidenceLevelLabel}</p>
          <p className="mt-1 text-xs text-[#5c6c66]">{confidence.recommendationLabel}</p>
        </div>
      </div>

      <p className="mt-3 rounded-md bg-[#f0f7f4] px-3 py-2 text-xs text-[#5c6c66]">
        Informational only — supports your decision; does not automate hiring.
      </p>
    </section>
  );
}
