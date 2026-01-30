"use client";

import { Card } from "@/components/ui/card";

export function RehireProbabilityWidget() {
  return (
    <Card className="p-6 border-slate-200 dark:border-slate-700">
      <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
        Rehire Probability
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Insight based on observed rehire patterns. Controlled by feature flag.
      </p>
    </Card>
  );
}
