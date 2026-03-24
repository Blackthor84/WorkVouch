"use client";

import { Card } from "@/components/ui/card";

export function WorkforceRiskIndicator() {
  return (
    <Card>
      <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">
        Workforce Risk Indicator
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Data-driven workforce insight. Controlled by feature flag.
      </p>
    </Card>
  );
}
