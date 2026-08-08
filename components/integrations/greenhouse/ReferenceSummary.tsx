"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { PanelReferenceSummary } from "@/lib/integrations/greenhouse/panel/types";
import { ghPanel } from "./panel-theme";
import { PanelEmptyReferencesState } from "./EmptyStates";

interface ReferenceSummaryProps {
  summary: PanelReferenceSummary;
  defaultExpanded?: boolean;
}

function consensusLabel(value: PanelReferenceSummary["overallConsensus"]): string {
  switch (value) {
    case "strong":
      return "Strong consensus";
    case "moderate":
      return "Moderate consensus";
    case "weak":
      return "Weak consensus";
    default:
      return "Insufficient data";
  }
}

function rehireLabel(value: PanelReferenceSummary["wouldRehire"]): string {
  switch (value) {
    case "yes":
      return "Would rehire";
    case "mixed":
      return "Mixed rehire intent";
    case "no":
      return "Would not rehire";
    default:
      return "Unknown";
  }
}

export function ReferenceSummary({ summary, defaultExpanded = false }: ReferenceSummaryProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const empty = summary.completed === 0 && summary.pending === 0;

  return (
    <section className={`${ghPanel.card} overflow-hidden`} aria-labelledby="wv-references-heading">
      <button
        type="button"
        id="wv-references-heading"
        className={`flex w-full items-center justify-between px-4 py-3 text-left ${ghPanel.focusRing}`}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={ghPanel.heading}>Reference Summary</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[#8a9690]" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#8a9690]" aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <div className={`${ghPanel.divider} px-4 pb-4 pt-2`}>
          {empty ? (
            <PanelEmptyReferencesState />
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-[#8a9690]">Completed</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums text-[#15372c]">{summary.completed}</dd>
                </div>
                <div>
                  <dt className="text-[#8a9690]">Pending</dt>
                  <dd className="mt-0.5 text-lg font-semibold tabular-nums text-[#15372c]">{summary.pending}</dd>
                </div>
                <div>
                  <dt className="text-[#8a9690]">Managers</dt>
                  <dd className="mt-0.5 font-medium tabular-nums">{summary.managers}</dd>
                </div>
                <div>
                  <dt className="text-[#8a9690]">Coworkers</dt>
                  <dd className="mt-0.5 font-medium tabular-nums">{summary.coworkers}</dd>
                </div>
              </dl>
              <div className="mt-3 space-y-1 text-xs">
                <p className="font-medium text-[#047957]">{consensusLabel(summary.overallConsensus)}</p>
                <p className="text-[#5c6c66]">{rehireLabel(summary.wouldRehire)}</p>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
