"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { PanelHiringIntelligencePreview } from "@/lib/integrations/greenhouse/panel/types";
import { ghPanel } from "./panel-theme";

interface CandidateInsightsProps {
  hiringIntelligence: PanelHiringIntelligencePreview;
  aiSummary?: string;
  aiSummaryGeneratedAt?: string;
  defaultExpanded?: boolean;
}

function formatHours(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export function CandidateInsights({
  hiringIntelligence,
  aiSummary,
  aiSummaryGeneratedAt,
  defaultExpanded = false,
}: CandidateInsightsProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section className={`${ghPanel.card} overflow-hidden`} aria-labelledby="wv-insights-heading">
      <button
        type="button"
        id="wv-insights-heading"
        className={`flex w-full items-center justify-between px-4 py-3 text-left ${ghPanel.focusRing}`}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={`${ghPanel.heading} flex items-center gap-1.5`}>
          <Sparkles className="h-3.5 w-3.5 text-[#047957]" aria-hidden="true" />
          Hiring Intelligence
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[#8a9690]" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#8a9690]" aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <div className={`${ghPanel.divider} space-y-4 px-4 pb-4 pt-2`}>
          {aiSummary && (
            <p className="text-xs leading-relaxed text-[#5c6c66]">
              {aiSummary}
              {aiSummaryGeneratedAt && (
                <span className="mt-1 block text-[10px] text-[#8a9690]">
                  Generated {new Date(aiSummaryGeneratedAt).toLocaleDateString()}
                </span>
              )}
            </p>
          )}

          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-[#8a9690]">Avg verification time</dt>
              <dd className="mt-0.5 font-medium tabular-nums text-[#15372c]">
                {formatHours(hiringIntelligence.averageVerificationTimeHours)}
              </dd>
            </div>
            <div>
              <dt className="text-[#8a9690]">Completion rate</dt>
              <dd className="mt-0.5 font-medium tabular-nums text-[#15372c]">
                {hiringIntelligence.completionRatePct !== null
                  ? `${hiringIntelligence.completionRatePct}%`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[#8a9690]">Avg reference time</dt>
              <dd className="mt-0.5 font-medium tabular-nums text-[#15372c]">
                {formatHours(hiringIntelligence.averageReferenceTimeHours)}
              </dd>
            </div>
            <div>
              <dt className="text-[#8a9690]">Automation</dt>
              <dd className="mt-0.5 font-medium text-[#15372c]">
                {hiringIntelligence.automationEnabled ? "Enabled" : "Manual"}
              </dd>
            </div>
          </dl>

          {hiringIntelligence.processingTimeMs !== null && (
            <p className="text-[10px] text-[#8a9690]">
              Panel data loaded in {hiringIntelligence.processingTimeMs}ms
            </p>
          )}
        </div>
      )}
    </section>
  );
}
