"use client";

import { Card } from "@/components/ui/card";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";

export type TrustPolicy = {
  id: string;
  policy_name: string;
  min_trust_score: number;
  min_verification_coverage: number;
  required_reference_type: string | null;
  min_trust_graph_depth: string | null;
  allow_recent_disputes: boolean;
  created_at: string;
};

export interface TrustPolicyCardProps {
  policy: TrustPolicy;
  onEdit?: (policy: TrustPolicy) => void;
  onDelete?: (policy: TrustPolicy) => void;
}

function formatRefType(t: string | null): string {
  if (!t) return "None";
  const s = String(t).toLowerCase();
  if (s === "supervisor" || s === "manager") return "Manager";
  if (s === "coworker") return "Coworker";
  if (s === "client") return "Client";
  return t;
}

function formatDepth(d: string | null): string {
  if (!d) return "Any";
  const s = String(d).toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function TrustPolicyCard({ policy, onEdit, onDelete }: TrustPolicyCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
          <ShieldCheckIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {policy.policy_name}
          </h3>
          <ul className="mt-2 space-y-0.5 text-sm text-slate-600 dark:text-slate-400">
            <li>Trust Score ≥ {policy.min_trust_score}</li>
            <li>Verification Coverage ≥ {policy.min_verification_coverage}%</li>
            <li>Reference: {formatRefType(policy.required_reference_type)}</li>
            <li>Trust Graph Depth ≥ {formatDepth(policy.min_trust_graph_depth)}</li>
            <li>{policy.allow_recent_disputes ? "Recent disputes allowed" : "No recent disputes"}</li>
          </ul>
          {(onEdit || onDelete) && (
            <div className="mt-3 flex gap-2">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(policy)}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(policy)}
                  className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
