"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ConfidenceFactor } from "@/lib/trust/confidence/types";
import { ghPanel } from "./panel-theme";

interface ConfidenceExplanationCardProps {
  explanation: string[];
  factors: ConfidenceFactor[];
}

export function ConfidenceExplanationCard({ explanation, factors }: ConfidenceExplanationCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className={`${ghPanel.card} overflow-hidden`} aria-labelledby="wv-confidence-explain-heading">
      <button
        type="button"
        id="wv-confidence-explain-heading"
        className={`flex w-full items-center justify-between px-4 py-3 text-left ${ghPanel.focusRing}`}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={ghPanel.heading}>Why this confidence?</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[#8a9690]" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#8a9690]" aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <div className={`${ghPanel.divider} space-y-3 px-4 pb-4 pt-2`}>
          <ul className="space-y-1 text-xs text-[#5c6c66]" role="list">
            {explanation.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>

          <ul className="space-y-2" role="list" aria-label="Confidence factor breakdown">
            {factors
              .filter((f) => f.contribution > 0 && f.status !== "negative")
              .slice(0, 8)
              .map((factor) => (
                <li
                  key={factor.id}
                  className="flex items-center justify-between rounded-md bg-[#fafbfa] px-2 py-1.5 text-[11px]"
                >
                  <span className="text-[#15372c]">{factor.label}</span>
                  <span className="tabular-nums text-[#047957]">+{factor.contribution}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </section>
  );
}
