"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { usePreview, saveEliteStateToStorage } from "@/lib/preview-context";
import type { PreviewState } from "@/lib/preview-context";

export default function PreviewInitializerClient() {
  const { setPreview } = usePreview();
  const searchParams = useSearchParams();

  useEffect(() => {
    const previewParam = searchParams.get("preview");
    if (previewParam === "true") {
      const plan = searchParams.get("plan");
      const feature = searchParams.get("feature");

      setPreview((prev) => {
        const base = prev ?? ({} as PreviewState);
        const next: PreviewState = {
          ...base,
          demoActive: true,
          previewPlanTier: plan ?? base.previewPlanTier ?? null,
          featureFlags: feature
            ? [...(base.featureFlags ?? []).filter((f) => f !== feature), feature]
            : base.featureFlags,
          previewFeatures:
            feature != null
              ? { ...base.previewFeatures, [feature]: true }
              : base.previewFeatures,
        };
        saveEliteStateToStorage(next);
        return next;
      });
    }
  }, [searchParams, setPreview]);

  return null;
}
