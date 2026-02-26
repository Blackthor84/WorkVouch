"use client";

import { IndustrySelector } from "./IndustrySelector";
import { INDUSTRY_THRESHOLDS, type Industry } from "@/lib/industries";
import { logPlaygroundAudit } from "@/lib/playground/auditClient";
import { INDUSTRY_SELECTOR } from "@/lib/playground/copy";
import { useState, useCallback } from "react";

type Props = {
  industry?: Industry;
  onIndustryChange?: (industry: Industry) => void;
};

export function SimulationPanel({ industry: controlledIndustry, onIndustryChange }: Props) {
  const [internalIndustry, setInternalIndustry] = useState<Industry>("healthcare");
  const industry = controlledIndustry ?? internalIndustry;
  const setIndustry = onIndustryChange ?? setInternalIndustry;
  const threshold = INDUSTRY_THRESHOLDS[industry];

  const handleIndustryChange = useCallback(
    (next: Industry) => {
      setIndustry(next);
      const nextThreshold = INDUSTRY_THRESHOLDS[next];
      logPlaygroundAudit("thresholds_changed", { industry: next, threshold: nextThreshold });
    },
    [setIndustry]
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">{INDUSTRY_SELECTOR.label}</h2>
      <p className="text-sm text-slate-600 mb-3">{INDUSTRY_SELECTOR.helperText}</p>
      <div className="flex flex-wrap items-center gap-4">
        <IndustrySelector value={industry} onChange={handleIndustryChange} />
        <span className="text-sm text-slate-600">
          Threshold: <strong>{threshold}</strong>
        </span>
      </div>
    </div>
  );
}
