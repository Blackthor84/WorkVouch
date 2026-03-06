"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { CheckBadgeIcon } from "@heroicons/react/24/outline";

type Summary = {
  manager: number;
  coworker: number;
  client: number;
  peer: number;
  total: number;
};

/**
 * Section 7 — Employer candidate profiles: Verified By (Manager, Coworker, Client), Total Confirmations.
 */
export function CandidateVerificationSummary({ candidateId }: { candidateId: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!candidateId) {
      setLoading(false);
      return;
    }
    fetch(`/api/employer/candidate/${encodeURIComponent(candidateId)}/verification-summary`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Summary | null) => {
        if (data) setSummary(data);
      })
      .finally(() => setLoading(false));
  }, [candidateId]);

  if (loading || !summary) return null;
  if (summary.total === 0) return null;

  const parts: string[] = [];
  if (summary.manager > 0) parts.push(`Manager (${summary.manager})`);
  if (summary.coworker > 0) parts.push(`Coworker (${summary.coworker})`);
  if (summary.client > 0) parts.push(`Client (${summary.client})`);
  if (summary.peer > 0) parts.push(`Peer (${summary.peer})`);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-[#0F172A] dark:text-gray-200 mb-2 flex items-center gap-2">
        <CheckBadgeIcon className="h-4 w-4 text-emerald-600" />
        Verified By
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {parts.length ? parts.join(", ") : "—"}
      </p>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1">
        Total confirmations: {summary.total}
      </p>
    </Card>
  );
}
