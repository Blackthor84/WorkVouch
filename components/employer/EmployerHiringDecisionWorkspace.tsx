"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  searchCandidatesForEmployer,
  type EmployerCandidateRow,
} from "@/lib/actions/employer/employerCandidateSearch";
import { TrustFilter } from "@/components/employer/TrustFilter";
import { CandidateExplorer } from "@/components/employer/CandidateExplorer";
import { CandidateCompare } from "@/components/employer/CandidateCompare";
import { ResumeRequests } from "@/components/employer/ResumeRequests";

type Props = {
  employerId?: string | null;
};

/**
 * Hiring decision tools: trust filter, candidate grid, compare, resume requests.
 */
export function EmployerHiringDecisionWorkspace({ employerId }: Props) {
  const [minTrust, setMinTrust] = useState(0);
  const [candidates, setCandidates] = useState<EmployerCandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [baseCost, setBaseCost] = useState(50_000);
  const [resumeRefresh, setResumeRefresh] = useState(0);
  const [pendingRequestCandidateIds, setPendingRequestCandidateIds] = useState(
    new Set<string>(),
  );

  const loadPendingResumeTargets = useCallback(async () => {
    try {
      const res = await fetch("/api/employer/resume-requests", {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) return;
      const rows = (data.requests ?? []) as {
        candidate_id: string;
        status: string;
      }[];
      const pending = new Set(
        rows.filter((r) => r.status === "pending").map((r) => r.candidate_id),
      );
      setPendingRequestCandidateIds(pending);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadPendingResumeTargets();
  }, [loadPendingResumeTargets, resumeRefresh]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchCandidatesForEmployer({ minTrust })
      .then((rows) => {
        if (!cancelled) setCandidates(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [minTrust]);

  const onToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  }, []);

  const byId = useMemo(() => {
    const m = new Map<string, EmployerCandidateRow>();
    for (const c of candidates) m.set(c.id, c);
    return m;
  }, [candidates]);

  const candidateA =
    selectedIds[0] != null ? (byId.get(selectedIds[0]) ?? null) : null;
  const candidateB =
    selectedIds[1] != null ? (byId.get(selectedIds[1]) ?? null) : null;

  return (
    <section className="mt-10 space-y-6 border-t border-gray-200 pt-10 dark:border-gray-800">
      <div>
        <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200">
          Hiring decision workspace
        </h2>
        <p className="mt-1 text-sm text-grey-medium dark:text-gray-400">
          Browse verified talent, filter by trust, compare estimated risk, and
          request resume access.
        </p>
      </div>

      <TrustFilter value={minTrust} onChange={setMinTrust} />

      <CandidateExplorer
        candidates={candidates}
        loading={loading}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
        employerId={employerId}
        requestedCandidateIds={pendingRequestCandidateIds}
        onResumeRequestComplete={() => {
          setResumeRefresh((n) => n + 1);
          void loadPendingResumeTargets();
        }}
      />

      <CandidateCompare
        candidateA={candidateA}
        candidateB={candidateB}
        baseCost={baseCost}
        onBaseCostChange={setBaseCost}
      />

      <ResumeRequests refreshToken={resumeRefresh} />
    </section>
  );
}
