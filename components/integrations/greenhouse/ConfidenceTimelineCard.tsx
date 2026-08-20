"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ConfidenceTimelinePoint } from "@/lib/trust/confidence/types";
import { ghPanel } from "./panel-theme";

interface ConfidenceTimelineCardProps {
  timeline: ConfidenceTimelinePoint[];
}

export function ConfidenceTimelineCard({ timeline }: ConfidenceTimelineCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (timeline.length === 0) return null;

  return (
    <section className={`${ghPanel.card} overflow-hidden`} aria-labelledby="wv-confidence-timeline-heading">
      <button
        type="button"
        id="wv-confidence-timeline-heading"
        className={`flex w-full items-center justify-between px-4 py-3 text-left ${ghPanel.focusRing}`}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={ghPanel.heading}>Confidence Timeline</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[#8a9690]" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#8a9690]" aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <ol className={`${ghPanel.divider} space-y-3 px-4 pb-4 pt-2`} role="list">
          {timeline.map((point, index) => (
            <li key={point.id} className="flex items-start gap-3 text-xs">
              <span className="mt-0.5 font-bold tabular-nums text-[#047957]" aria-hidden="true">
                {index < timeline.length - 1 ? "↓" : "●"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#15372c]">{point.label}</p>
                <p className="tabular-nums text-[#5c6c66]">
                  {point.confidenceScore}%
                  {point.delta !== undefined && point.delta > 0 && (
                    <span className="ml-1 text-[#047957]">(+{point.delta})</span>
                  )}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
