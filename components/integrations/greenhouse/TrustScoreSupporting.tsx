"use client";

import { ghPanel } from "./panel-theme";

interface TrustScoreSupportingProps {
  trustScore: number | null;
  trustBand: string | null;
}

/** Compact supporting trust score — hero is Hiring Confidence. */
export function TrustScoreSupporting({ trustScore, trustBand }: TrustScoreSupportingProps) {
  if (trustScore === null) return null;

  return (
    <section
      className={`${ghPanel.card} px-4 py-3`}
      aria-label={`Supporting trust score ${trustScore}`}
    >
      <dl className="flex items-center justify-between text-xs">
        <div>
          <dt className="text-[#8a9690]">Trust Score</dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-[#15372c]">{trustScore}</dd>
        </div>
        <div className="text-right">
          <dt className="text-[#8a9690]">Band</dt>
          <dd className="mt-0.5 font-medium text-[#047957]">{trustBand ?? "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
