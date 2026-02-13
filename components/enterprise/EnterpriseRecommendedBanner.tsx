"use client";

import { useEffect, useState } from "react";

interface HealthData {
  status: string;
  enterprise_recommended: boolean;
  summary: string;
  recommended_plan: string | null;
  hint: string | null;
}

export function EnterpriseRecommendedBanner({ orgId }: { orgId: string }) {
  const [data, setData] = useState<HealthData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/enterprise/organizations/${encodeURIComponent(orgId)}/health`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.enterprise_recommended) setData(d);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [orgId]);

  if (!data?.enterprise_recommended) return null;

  return (
    <div className="rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-900/20 p-4 text-amber-800 dark:text-amber-200">
      <p className="font-semibold">Enterprise Recommended</p>
      <p className="text-sm mt-1">{data.hint ?? data.summary}</p>
      {data.recommended_plan && (
        <p className="text-xs mt-2 opacity-90">Upgrade to {data.recommended_plan} for headroom and multi-location support.</p>
      )}
    </div>
  );
}
