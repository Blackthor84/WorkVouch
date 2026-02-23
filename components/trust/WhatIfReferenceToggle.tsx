"use client";

import { useState } from "react";
import { recomputeWithoutReference } from "@/lib/trust/recomputeWithoutReference";
import type { TrustScoreData } from "@/lib/trust/types";

type WhatIfReferenceToggleProps = {
  base: TrustScoreData;
  currentScore: number;
  referenceId: string;
  referenceLabel?: string;
};

/** Toggle to exclude one reference → recompute score → animate delta. */
export function WhatIfReferenceToggle({
  base,
  currentScore,
  referenceId,
  referenceLabel = referenceId,
}: WhatIfReferenceToggleProps) {
  const [excluded, setExcluded] = useState(false);

  const scoreWithout = recomputeWithoutReference(base, referenceId);
  const delta = scoreWithout - currentScore;

  return (
    <div className="flex items-center gap-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={excluded}
          onChange={(e) => setExcluded(e.target.checked)}
          className="rounded border-slate-300"
        />
        <span>What if we ignored &quot;{referenceLabel}&quot;?</span>
      </label>
      {excluded && (
        <span
          className={
            delta >= 0
              ? "text-green-700 font-medium"
              : "text-amber-700 font-medium"
          }
        >
          Score: {scoreWithout} ({delta >= 0 ? "+" : ""}{delta})
        </span>
      )}
    </div>
  );
}
