"use client";

import type { TrustScoreFactor } from "@/lib/integrations/greenhouse/panel/types";
import { formatConfidence, ghPanel } from "./panel-theme";

interface ExplainabilityCardProps {
  factors: TrustScoreFactor[];
  score: number | null;
}

export function ExplainabilityCard({ factors, score }: ExplainabilityCardProps) {
  if (!score || factors.length === 0) return null;

  return (
    <section
      className={`${ghPanel.card} ${ghPanel.cardPadding}`}
      aria-labelledby="wv-explain-heading"
    >
      <h2 id="wv-explain-heading" className={ghPanel.heading}>
        Calculated From
      </h2>
      <ul className="mt-3 space-y-2" role="list">
        {factors.map((factor) => (
          <li
            key={factor.id}
            className="rounded-md border border-[#eef1ef] bg-[#fafbfa] px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`text-xs font-medium ${
                  factor.status === "positive"
                    ? "text-[#047957]"
                    : factor.status === "negative"
                      ? "text-red-600"
                      : "text-[#5c6c66]"
                }`}
              >
                {factor.label}
              </span>
              <span className="text-[10px] tabular-nums text-[#8a9690]">
                {Math.round(factor.contribution)} pts
              </span>
            </div>
            <dl className="mt-1 grid grid-cols-3 gap-1 text-[10px] text-[#8a9690]">
              <div>
                <dt className="sr-only">Weight</dt>
                <dd>Weight {Math.round(factor.weight * 100)}%</dd>
              </div>
              <div>
                <dt className="sr-only">Contribution</dt>
                <dd>+{Math.round(factor.contribution)}</dd>
              </div>
              <div>
                <dt className="sr-only">Confidence</dt>
                <dd>{formatConfidence(factor.confidence)} conf.</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
