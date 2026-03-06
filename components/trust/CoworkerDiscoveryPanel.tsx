"use client";

import { useState, useEffect } from "react";
import { CoworkerSuggestionCard, type CoworkerSuggestion } from "@/components/trust/CoworkerSuggestionCard";
import { BulkVerificationButton } from "@/components/trust/BulkVerificationButton";

type Props = {
  employmentRecordId: string;
  companyName: string;
};

export function CoworkerDiscoveryPanel({ employmentRecordId, companyName }: Props) {
  const [coworkers, setCoworkers] = useState<CoworkerSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const handleRequestVerification = async (profileId: string, empRecordId: string) => {
    setRequestingId(profileId);
    try {
      const res = await fetch("/api/verification/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          target_profile_id: profileId,
          employment_record_id: empRecordId,
          relationship_type: "coworker",
        }),
      });
      if (res.ok) {
        setCoworkers((prev) => prev.filter((c) => c.profileId !== profileId));
      }
    } finally {
      setRequestingId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const url = `/api/trust/coworkers/${encodeURIComponent(employmentRecordId)}`;
    fetch(url, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { coworkers: [] }))
      .then((data: { coworkers?: CoworkerSuggestion[] }) => {
        if (!cancelled && Array.isArray(data.coworkers)) setCoworkers(data.coworkers);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [employmentRecordId]);

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading coworkers…</p>
      </div>
    );
  }

  if (coworkers.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
        People who may have worked with you
      </h3>
      <ul className="space-y-2" aria-label="Suggested coworkers">
        {coworkers.map((c) => (
          <li key={c.profileId}>
            <CoworkerSuggestionCard
              coworker={c}
              employmentRecordId={employmentRecordId}
              onRequestVerification={handleRequestVerification}
              requesting={requestingId === c.profileId}
            />
          </li>
        ))}
      </ul>
      <BulkVerificationButton
        employmentRecordId={employmentRecordId}
        coworkerIds={coworkers.map((c) => c.profileId)}
        companyName={companyName}
        onSuccess={() => setCoworkers([])}
      />
    </div>
  );
}
