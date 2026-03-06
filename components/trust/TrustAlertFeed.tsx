"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BellAlertIcon } from "@heroicons/react/24/outline";

export type TrustAlert = {
  id: string;
  alert_type: string;
  alert_message: string;
  candidate_id: string | null;
  rule_id: string | null;
  created_at: string;
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  candidate_meets_policy: "Policy match",
  candidate_trust_risk: "Trust risk",
  employee_trust_risk: "Employee risk",
  verification_expiring: "Verification",
  credential_shared: "Credential",
};

export interface TrustAlertFeedProps {
  limit?: number;
}

export function TrustAlertFeed({ limit = 20 }: TrustAlertFeedProps) {
  const [alerts, setAlerts] = useState<TrustAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/employer/automation/alerts?limit=${limit}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { alerts: [] }))
      .then((data: { alerts?: TrustAlert[] }) => {
        if (!cancelled && Array.isArray(data.alerts)) setAlerts(data.alerts);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  if (loading) {
    return (
      <Card className="p-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
          <BellAlertIcon className="h-5 w-5" />
          Recent alerts
        </h3>
        <div className="h-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
        <BellAlertIcon className="h-5 w-5" />
        Recent alerts
      </h3>
      {alerts.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No alerts yet.</p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {alerts.map((a) => (
            <li
              key={a.id}
              className="text-sm border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0"
            >
              <span className="text-slate-500 dark:text-slate-400">
                {ALERT_TYPE_LABELS[a.alert_type] ?? a.alert_type} ·{" "}
                {new Date(a.created_at).toLocaleDateString()}
              </span>
              <p className="text-slate-800 dark:text-slate-200 mt-0.5 line-clamp-2">
                {a.alert_message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
