"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { PanelEmploymentEntry } from "@/lib/integrations/greenhouse/panel/types";
import { formatConfidence, ghPanel } from "./panel-theme";
import { PanelEmptyTimelineState } from "./EmptyStates";

interface EmploymentTimelineProps {
  entries: PanelEmploymentEntry[];
  defaultExpanded?: boolean;
}

export function EmploymentTimeline({ entries, defaultExpanded = false }: EmploymentTimelineProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <section className={`${ghPanel.card} overflow-hidden`} aria-labelledby="wv-timeline-heading">
      <button
        type="button"
        id="wv-timeline-heading"
        className={`flex w-full items-center justify-between px-4 py-3 text-left ${ghPanel.focusRing}`}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span className={ghPanel.heading}>Employment Timeline</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[#8a9690]" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#8a9690]" aria-hidden="true" />
        )}
      </button>

      {expanded && (
        <div className={`${ghPanel.divider} px-4 pb-4 pt-2`}>
          {entries.length === 0 ? (
            <PanelEmptyTimelineState />
          ) : (
            <ol className="space-y-3" role="list">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="relative border-l-2 border-[#047957]/30 pl-4"
                >
                  <p className="text-sm font-medium text-[#15372c]">{entry.employer}</p>
                  <p className="text-xs text-[#5c6c66]">{entry.role}</p>
                  <p className="mt-1 text-[10px] text-[#8a9690]">
                    {entry.startDate} — {entry.endDate ?? "Present"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                    <span
                      className={`rounded px-1.5 py-0.5 ${
                        entry.verificationStatus === "verified"
                          ? "bg-[#e6f4ef] text-[#047957]"
                          : "bg-[#f3f5f4] text-[#5c6c66]"
                      }`}
                    >
                      {entry.verificationStatus === "verified" ? "Verified" : "Pending"}
                    </span>
                    {entry.managerVerified && (
                      <span className="rounded bg-[#eef1ef] px-1.5 py-0.5 text-[#5c6c66]">Manager ✓</span>
                    )}
                    {entry.coworkerVerified && (
                      <span className="rounded bg-[#eef1ef] px-1.5 py-0.5 text-[#5c6c66]">Coworker ✓</span>
                    )}
                    <span className="text-[#8a9690]">{formatConfidence(entry.timelineConfidence)} confidence</span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
