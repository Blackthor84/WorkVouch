"use client";

import { Card } from "@/components/ui/card";
import { BoltIcon } from "@heroicons/react/24/outline";

export type TrustAutomationRule = {
  id: string;
  rule_name: string;
  rule_type: string;
  rule_conditions: Record<string, unknown>;
  notification_type: string;
  created_at: string;
};

const RULE_TYPE_LABELS: Record<string, string> = {
  candidate_meets_policy: "Candidate meets policy",
  candidate_trust_risk: "Candidate trust risk",
  employee_trust_risk: "Employee trust risk",
  verification_expiring: "Verification expiring",
  credential_shared: "Credential shared",
};

export interface TrustAutomationRuleCardProps {
  rule: TrustAutomationRule;
}

export function TrustAutomationRuleCard({ rule }: TrustAutomationRuleCardProps) {
  const cond = rule.rule_conditions || {};
  const label = RULE_TYPE_LABELS[rule.rule_type] ?? rule.rule_type;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
          <BoltIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {rule.rule_name}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          {(cond.policy_id || cond.min_trust_score != null) && (
            <ul className="mt-2 text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
              {cond.policy_id != null && (
                <li>Policy: {String(cond.policy_id as string).slice(0, 8)}...</li>
              )}
              {cond.min_trust_score != null && (
                <li>Min trust score: {String(cond.min_trust_score)}</li>
              )}
            </ul>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Action: {rule.notification_type.replace(/_/g, " ")}
          </p>
        </div>
      </div>
    </Card>
  );
}
