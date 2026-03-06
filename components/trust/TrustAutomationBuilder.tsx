"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BoltIcon } from "@heroicons/react/24/outline";
import type { TrustPolicy } from "@/components/trust/TrustPolicyCard";

const RULE_TYPES = [
  { value: "candidate_meets_policy", label: "Candidate meets policy" },
  { value: "candidate_trust_risk", label: "Candidate trust risk" },
  { value: "employee_trust_risk", label: "Employee trust risk" },
  { value: "verification_expiring", label: "Verification expiring" },
  { value: "credential_shared", label: "Credential shared" },
];

const NOTIFICATION_TYPES = [
  { value: "create_dashboard_alert", label: "Dashboard alert" },
  { value: "send_notification", label: "Send notification" },
  { value: "log_trust_event", label: "Log trust event" },
];

export interface TrustAutomationBuilderProps {
  onCreated?: () => void;
}

export function TrustAutomationBuilder({ onCreated }: TrustAutomationBuilderProps) {
  const [ruleName, setRuleName] = useState("");
  const [ruleType, setRuleType] = useState("candidate_meets_policy");
  const [policyId, setPolicyId] = useState("");
  const [minTrustScore, setMinTrustScore] = useState(50);
  const [notificationType, setNotificationType] = useState("create_dashboard_alert");
  const [policies, setPolicies] = useState<TrustPolicy[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/employer/policies", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { policies: [] }))
      .then((d: { policies?: TrustPolicy[] }) => {
        setPolicies(Array.isArray(d.policies) ? d.policies : []);
      })
      .catch(() => setPolicies([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const conditions: Record<string, unknown> = {};
    if (ruleType === "candidate_meets_policy" && policyId) conditions.policy_id = policyId;
    if (ruleType === "candidate_trust_risk" || ruleType === "employee_trust_risk") {
      conditions.min_trust_score = minTrustScore;
    }
    try {
      const res = await fetch("/api/employer/automation/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rule_name: ruleName.trim(),
          rule_type: ruleType,
          rule_conditions: conditions,
          notification_type: notificationType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create rule");
        return;
      }
      setRuleName("");
      setPolicyId("");
      setMinTrustScore(50);
      onCreated?.();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
        <BoltIcon className="h-5 w-5" />
        New automation rule
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Run when trust events occur. Event-driven; no full scans.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Rule name
          </label>
          <input
            type="text"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="e.g. Alert when saved candidate meets bar"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Rule type
          </label>
          <select
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
          >
            {RULE_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {ruleType === "candidate_meets_policy" && policies.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Policy
            </label>
            <select
              value={policyId}
              onChange={(e) => setPolicyId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
            >
              <option value="">Select policy</option>
              {policies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.policy_name}
                </option>
              ))}
            </select>
          </div>
        )}
        {(ruleType === "candidate_trust_risk" || ruleType === "employee_trust_risk") && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Min trust score (below = risk)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={minTrustScore}
              onChange={(e) => setMinTrustScore(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Action
          </label>
          <select
            value={notificationType}
            onChange={(e) => setNotificationType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm"
          >
            {NOTIFICATION_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create rule"}
        </Button>
      </form>
    </Card>
  );
}
