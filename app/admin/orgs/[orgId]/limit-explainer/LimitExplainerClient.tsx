"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface LimitExplainerData {
  organization_id: string;
  plan_type: string;
  plan_limits: { max_locations: number; max_admins: number; max_monthly_checks: number };
  current_usage: { monthly_checks: number; usage_percent: number | null };
  blocked_actions_last_30_days: number;
  abuse_signals: {
    risk_score: number;
    flags: string[];
    enterprise_recommended: boolean;
    recommendation_reason: string | null;
    hint: string | null;
  };
  health: {
    status: string;
    score: number;
    summary: string;
    recommended_plan: string | null;
  };
  recommendation: "none" | "enterprise";
  explanation: string;
}

export function LimitExplainerClient({ orgId }: { orgId: string }) {
  const [data, setData] = useState<LimitExplainerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/orgs/${encodeURIComponent(orgId)}/limit-explainer`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error("Organization not found");
          if (res.status === 403) throw new Error("Forbidden");
          throw new Error("Failed to load");
        }
        return res.json();
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Request failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  if (loading) {
    return <div className="p-6 text-slate-500">Loading…</div>;
  }
  if (error) {
    return (
      <div className="p-6 text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }
  if (!data) {
    return <div className="p-6 text-slate-500">No data.</div>;
  }

  const { plan_limits, current_usage, blocked_actions_last_30_days, abuse_signals, health, recommendation, explanation } = data;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Plan vs usage
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <dt className="text-slate-500 dark:text-slate-400">Plan</dt>
          <dd className="font-medium text-slate-900 dark:text-white">{data.plan_type}</dd>
          <dt className="text-slate-500 dark:text-slate-400">Max locations</dt>
          <dd className="text-slate-900 dark:text-white">{plan_limits.max_locations < 0 ? "Unlimited" : plan_limits.max_locations}</dd>
          <dt className="text-slate-500 dark:text-slate-400">Max admins</dt>
          <dd className="text-slate-900 dark:text-white">{plan_limits.max_admins < 0 ? "Unlimited" : plan_limits.max_admins}</dd>
          <dt className="text-slate-500 dark:text-slate-400">Max monthly checks</dt>
          <dd className="text-slate-900 dark:text-white">{plan_limits.max_monthly_checks < 0 ? "Unlimited" : plan_limits.max_monthly_checks}</dd>
          <dt className="text-slate-500 dark:text-slate-400">Current monthly checks</dt>
          <dd className="text-slate-900 dark:text-white">{current_usage.monthly_checks}</dd>
          <dt className="text-slate-500 dark:text-slate-400">Usage %</dt>
          <dd className="text-slate-900 dark:text-white">{current_usage.usage_percent != null ? `${current_usage.usage_percent}%` : "—"}</dd>
        </dl>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Blocked actions & abuse signals
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          Blocked actions (last 30 days): <strong className="text-slate-900 dark:text-white">{blocked_actions_last_30_days}</strong>
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          Abuse risk score: <strong className="text-slate-900 dark:text-white">{abuse_signals.risk_score}</strong>
          {abuse_signals.enterprise_recommended && (
            <span className="ml-2 text-amber-600 dark:text-amber-400">(Enterprise recommended)</span>
          )}
        </p>
        {abuse_signals.flags.length > 0 && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Flags: <span className="text-slate-900 dark:text-white">{abuse_signals.flags.join(", ")}</span>
          </p>
        )}
        {abuse_signals.hint && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">{abuse_signals.hint}</p>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Org health
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          Status: <strong className="text-slate-900 dark:text-white">{health.status}</strong> (score: {health.score})
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">{health.summary}</p>
        {health.recommended_plan && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
            Recommended plan: {health.recommended_plan}
          </p>
        )}
      </Card>

      <Card className={`p-6 ${recommendation === "enterprise" ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20" : ""}`}>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Upgrade recommendation
        </h2>
        <p className="text-sm font-medium text-slate-900 dark:text-white">
          {recommendation === "enterprise" ? "Enterprise" : "None"}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{explanation}</p>
      </Card>
    </div>
  );
}
