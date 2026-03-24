"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export type RiskAlert = {
  id: string;
  message: string;
  category?: string;
};

export type RiskAlertsData = {
  riskLevel: "low" | "medium" | "high";
  alerts: RiskAlert[];
};

interface RiskAlertPanelProps {
  candidateId: string;
}

const RISK_STYLES = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export function RiskAlertPanel({ candidateId }: RiskAlertPanelProps) {
  const [data, setData] = useState<RiskAlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/employer/risk/${encodeURIComponent(candidateId)}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((body: RiskAlertsData) => {
        if (!cancelled) setData(body);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load risk alerts.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [candidateId]);

  if (loading) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Risk alerts</h2>
        <div className="h-10 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Risk alerts</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error ?? "No data."}</p>
      </Card>
    );
  }

  const levelLabel = data.riskLevel.charAt(0).toUpperCase() + data.riskLevel.slice(1);
  const style = RISK_STYLES[data.riskLevel];

  return (
    <Card>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Risk alerts</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Neutral summary of verification and consistency signals.
      </p>
      <div className="flex items-center gap-2 mb-4">
        {data.riskLevel === "low" ? (
          <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        )}
        <span className={`inline-block text-sm font-medium px-2 py-1 rounded ${style}`}>{levelLabel}</span>
      </div>
      {data.alerts.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No alerts.</p>
      ) : (
        <ul className="space-y-2">
          {data.alerts.map((a) => (
            <li key={a.id} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
              <span className="text-slate-400 mt-0.5">•</span>
              <span>{a.message}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
