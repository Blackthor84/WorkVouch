"use client";

import { WvTrustScore } from "@/components/wv/WvTrustScore";
import { ghPanel } from "./panel-theme";

interface TrustScoreCardProps {
  score: number | null;
  band: string | null;
  verificationStatus: string;
  employmentVerified: boolean;
  lastUpdated: string;
}

export function TrustScoreCard({
  score,
  band,
  verificationStatus,
  employmentVerified,
  lastUpdated,
}: TrustScoreCardProps) {
  const hasScore = score !== null && score >= 0;

  return (
    <section
      className={`${ghPanel.card} ${ghPanel.cardPadding}`}
      aria-labelledby="wv-trust-heading"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="wv-trust-heading" className={ghPanel.heading}>
            Trust Score
          </h2>
          <p className="text-xs text-[#5c6c66]">
            Updated {new Date(lastUpdated).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>
        {employmentVerified && (
          <span className="rounded-full bg-[#e6f4ef] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#047957]">
            Verified
          </span>
        )}
      </div>

      {hasScore ? (
        <div className="mt-4 flex items-center gap-4">
          <div aria-label={`Trust score ${score} out of 100`}>
            <WvTrustScore score={score!} size="sm" />
          </div>
          <div>
            <p className="text-3xl font-bold tabular-nums text-[#15372c]">{score}</p>
            <p className="text-xs text-[#5c6c66]">out of 100</p>
            {band && (
              <p className="mt-1 text-sm font-semibold text-[#047957]">{band}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-[#5c6c66]" role="status">
          {verificationStatus === "not_started"
            ? "Trust score pending — invite candidate to WorkVouch."
            : "Trust score will appear after verification."}
        </p>
      )}
    </section>
  );
}
