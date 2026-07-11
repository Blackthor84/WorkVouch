"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { WvCard, WvButton } from "@/components/wv";
import { TrustTrajectoryBadge } from "@/components/trust/TrustTrajectoryBadge";

export type CompareCandidateItem = {
  candidateId: string;
  name: string | null;
  verificationSummary: string;
  verifiedEmploymentCount: number;
  totalEmploymentCount: number;
  verifiedEmploymentCoveragePct: number;
  trustBand: string;
  trustLabel: string;
  trustExplanation: string;
  referenceCount: number;
  flagIndicators: string[];
  trustTrajectory: "improving" | "stable" | "at_risk";
  trustTrajectoryLabel: string;
  trustTrajectoryTooltipFactors: string[];
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseIds(idsParam: string | null): string[] {
  if (!idsParam?.trim()) return [];
  return idsParam
    .split(",")
    .map((s) => s.trim())
    .filter((id) => UUID_REGEX.test(id));
}

export function CompareViewClient() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids");
  const [candidates, setCandidates] = useState<CompareCandidateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompare = useCallback(async (candidateIds: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/employer/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ candidateIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to load comparison");
        setCandidates([]);
        return;
      }
      setCandidates((data as { candidates?: CompareCandidateItem[] }).candidates ?? []);
    } catch {
      setError("Failed to load comparison");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ids = parseIds(idsParam);
    if (ids.length >= 2 && ids.length <= 4) {
      fetchCompare(ids);
    } else {
      setLoading(false);
      setError(ids.length === 0 ? "No candidates selected." : "Select 2–4 candidates to compare.");
      setCandidates([]);
    }
  }, [idsParam, fetchCompare]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-b-transparent" />
        <p className="mt-4 text-wv-muted">Loading comparison...</p>
      </div>
    );
  }

  if (error && candidates.length === 0) {
    return (
      <WvCard>
        <p className="text-wv-foreground">{error}</p>
        <WvButton href="/employer/search-users" variant="outline" className="mt-4">
          Back to search
        </WvButton>
      </WvCard>
    );
  }

  const rows: { label: string; key: keyof CompareCandidateItem }[] = [
    { label: "Verified employment coverage", key: "verifiedEmploymentCoveragePct" },
    { label: "Trust band", key: "trustLabel" },
    { label: "Explanation", key: "trustExplanation" },
    { label: "Reference count", key: "referenceCount" },
    { label: "Flag indicators", key: "flagIndicators" },
  ];

  return (
    <WvCard padding="none" className="overflow-hidden">
      <div className="overflow-x-auto p-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-wv-border">
              <th className="text-left py-3 px-4 font-semibold text-wv-foreground w-48">Metric</th>
              {candidates.map((c) => (
                <th key={c.candidateId} className="text-left py-3 px-4 font-semibold text-wv-foreground min-w-[180px]">
                  <div className="flex flex-col gap-1">
                    <span>{c.name ?? "Unknown"}</span>
                    <WvButton href={`/employer/profile/${c.candidateId}`} variant="ghost" size="sm" className="w-fit">
                      View profile
                    </WvButton>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, key }) => (
              <tr key={key} className="border-b border-wv-border">
                <td className="py-3 px-4 text-wv-muted font-medium">{label}</td>
                {candidates.map((c) => {
                  const value = c[key];
                  if (key === "trustTrajectoryLabel") {
                    return (
                      <td key={c.candidateId} className="py-3 px-4 text-wv-foreground">
                        <TrustTrajectoryBadge
                          trajectory={c.trustTrajectory ?? "stable"}
                          label={c.trustTrajectoryLabel}
                          tooltipFactors={c.trustTrajectoryTooltipFactors}
                          size="sm"
                        />
                      </td>
                    );
                  }
                  if (key === "verifiedEmploymentCoveragePct") {
                    const pct = typeof value === "number" ? value : 0;
                    return (
                      <td key={c.candidateId} className="py-3 px-4 text-wv-foreground">
                        {pct}%
                      </td>
                    );
                  }
                  if (key === "referenceCount") {
                    return (
                      <td key={c.candidateId} className="py-3 px-4 text-wv-foreground">
                        {Number(value)}
                      </td>
                    );
                  }
                  if (key === "flagIndicators") {
                    const flags = value as string[];
                    return (
                      <td key={c.candidateId} className="py-3 px-4 text-wv-foreground">
                        {flags.length > 0 ? (
                          <ul className="list-disc list-inside text-sm">
                            {flags.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-wv-subtle">None</span>
                        )}
                      </td>
                    );
                  }
                  return (
                    <td key={c.candidateId} className="py-3 px-4 text-wv-foreground text-sm">
                      {String(value ?? "—")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 pb-6">
        <WvButton href="/employer/search-users" variant="outline">
          Back to search
        </WvButton>
      </div>
    </WvCard>
  );
}
