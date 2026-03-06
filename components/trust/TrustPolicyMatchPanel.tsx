"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import type { PolicyMatchResult } from "@/lib/trust/policy";
import { TrustPolicyCriteriaList } from "./TrustPolicyCriteriaList";

export interface TrustPolicyMatchPanelProps {
  candidateId: string;
}

export function TrustPolicyMatchPanel({ candidateId }: TrustPolicyMatchPanelProps) {
  const [matches, setMatches] = useState<PolicyMatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = "/api/employer/policy-match/" + encodeURIComponent(candidateId);
    fetch(url, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((body: { matches?: PolicyMatchResult[] }) => {
        if (!cancelled) {
          const list = Array.isArray(body.matches) ? body.matches : [];
          setMatches(list);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load trust policy matches.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  if (loading) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Trust Compatibility
        </h2>
        <div className="h-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Trust Compatibility
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
      </Card>
    );
  }

  if (matches.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Trust Compatibility
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No hiring standards defined. Add policies in Hiring Standards on your dashboard to see
          compatibility here.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Trust Compatibility
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        How this candidate matches your defined trust standards.
      </p>
      <div className="space-y-5">
        {matches.map((m) => (
          <div key={m.policyId} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheckIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              <span className="font-medium text-slate-900 dark:text-slate-100">{m.policyName}</span>
              <span className="ml-auto text-lg font-semibold text-slate-900 dark:text-slate-100">
                Match: {m.matchScore}%
              </span>
            </div>
            <TrustPolicyCriteriaList
              matchedCriteria={m.matchedCriteria}
              failedCriteria={m.failedCriteria}
              showFailedAsWarning={m.failedCriteria.includes("trust_graph_depth")}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
