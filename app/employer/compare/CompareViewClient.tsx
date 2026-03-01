"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type CompareCandidateItem = {
  candidateId: string;
  name: string | null;
  verificationSummary: string;
  verifiedEmploymentCount: number;
  trustBand: string;
  trustLabel: string;
  trustExplanation: string;
  referenceCount: number;
  flagIndicators: string[];
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
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-b-transparent dark:border-blue-400" />
        <p className="mt-4 text-grey-medium dark:text-gray-400">Loading comparison...</p>
      </div>
    );
  }

  if (error && candidates.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-grey-dark dark:text-gray-200">{error}</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/employer/search-users">Back to search</Link>
        </Button>
      </Card>
    );
  }

  const rows: { label: string; key: keyof CompareCandidateItem }[] = [
    { label: "Verification status", key: "verificationSummary" },
    { label: "Trust band", key: "trustLabel" },
    { label: "Explanation", key: "trustExplanation" },
    { label: "Reference count", key: "referenceCount" },
    { label: "Flag indicators", key: "flagIndicators" },
  ];

  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-grey-background dark:border-[#374151]">
              <th className="text-left py-3 px-4 font-semibold text-grey-dark dark:text-gray-200 w-48">
                Metric
              </th>
              {candidates.map((c) => (
                <th
                  key={c.candidateId}
                  className="text-left py-3 px-4 font-semibold text-grey-dark dark:text-gray-200 min-w-[180px]"
                >
                  <div className="flex flex-col gap-1">
                    <span>{c.name ?? "Unknown"}</span>
                    <Button asChild variant="ghost" size="sm" className="w-fit">
                      <Link href={`/employer/profile/${c.candidateId}`}>
                        View profile
                      </Link>
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, key }) => (
              <tr
                key={key}
                className="border-b border-grey-background dark:border-[#374151]"
              >
                <td className="py-3 px-4 text-grey-medium dark:text-gray-400 font-medium">
                  {label}
                </td>
                {candidates.map((c) => {
                  const value = c[key];
                  if (key === "referenceCount") {
                    return (
                      <td key={c.candidateId} className="py-3 px-4 text-grey-dark dark:text-gray-200">
                        {Number(value)}
                      </td>
                    );
                  }
                  if (key === "flagIndicators") {
                    const flags = value as string[];
                    return (
                      <td key={c.candidateId} className="py-3 px-4 text-grey-dark dark:text-gray-200">
                        {flags.length > 0 ? (
                          <ul className="list-disc list-inside text-sm">
                            {flags.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-grey-medium dark:text-gray-400">None</span>
                        )}
                      </td>
                    );
                  }
                  return (
                    <td key={c.candidateId} className="py-3 px-4 text-grey-dark dark:text-gray-200 text-sm">
                      {String(value ?? "—")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button asChild variant="outline" className="mt-6">
        <Link href="/employer/search-users">Back to search</Link>
      </Button>
    </Card>
  );
}
