"use client";

import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import type { PolicyCriterion } from "@/lib/trust/policy";

const CRITERION_LABELS: Record<PolicyCriterion, string> = {
  trust_score: "Trust score requirement met",
  verification_coverage: "Verification coverage sufficient",
  reference_type: "Required reference type present",
  trust_graph_depth: "Trust graph depth requirement met",
  no_recent_disputes: "No recent disputes",
};

type Status = "matched" | "failed" | "warning";

export interface TrustPolicyCriteriaListProps {
  matchedCriteria: PolicyCriterion[];
  failedCriteria: PolicyCriterion[];
  showFailedAsWarning?: boolean;
}

export function TrustPolicyCriteriaList({
  matchedCriteria,
  failedCriteria,
  showFailedAsWarning = false,
}: TrustPolicyCriteriaListProps) {
  const renderCriterion = (criterion: PolicyCriterion, status: Status) => {
    const label = CRITERION_LABELS[criterion];
    const isWarning = status === "failed" && showFailedAsWarning;
    if (status === "matched") {
      return (
        <li key={criterion} className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircleIcon className="h-5 w-5 shrink-0" />
          <span>{label}</span>
        </li>
      );
    }
    if (isWarning) {
      return (
        <li key={criterion} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
          <span>{label}</span>
        </li>
      );
    }
    return (
      <li key={criterion} className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
        <XCircleIcon className="h-5 w-5 shrink-0" />
        <span>{label}</span>
      </li>
    );
  };

  return (
    <ul className="space-y-1.5">
      {matchedCriteria.map((c) => renderCriterion(c, "matched"))}
      {failedCriteria.map((c) =>
        renderCriterion(c, showFailedAsWarning ? "warning" : "failed")
      )}
    </ul>
  );
}
