"use client";

import type { HumanFactorInsights as HumanFactorInsightsType } from "@/lib/trust/types";

type Props = {
  /** From snapshot.engineOutputs.humanFactorInsights; optional. */
  humanFactorInsights: HumanFactorInsightsType | null | undefined;
};

/**
 * Displays human factor insights as interpretive narrative only.
 * No standalone scores or personality labels. Auditable, event-driven.
 */
export function HumanFactorInsightsPanel({ humanFactorInsights }: Props) {
  if (!humanFactorInsights?.insights?.length) return null;

  return (
    <details className="rounded-xl border border-slate-200 bg-white overflow-hidden" open={false}>
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-800 bg-slate-50 hover:bg-slate-100 border-b border-slate-200">
        Human factor insights
      </summary>
      <div className="p-4 space-y-3 text-sm text-slate-700">
        <p className="text-xs text-slate-500 italic">
          Derived from observable signals only (engagement, timing, network). Not personality or character. For audit and context.
        </p>
        <ul className="list-disc list-inside space-y-1.5 text-xs">
          {humanFactorInsights.insights.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}
