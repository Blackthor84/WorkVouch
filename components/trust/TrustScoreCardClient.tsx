"use client";

import { useState, useEffect } from "react";
import { TrustCard } from "@/components/trust/TrustCard";
import type { TrustExplanationLine, TrustBadge } from "@/lib/trust/trustExplanation";

type TrustResponse = {
  score: number;
  trajectoryLabel?: string;
  explanation?: TrustExplanationLine[];
  badges?: TrustBadge[];
};

export function TrustScoreCardClient() {
  const [data, setData] = useState<TrustResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/trust/me", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load score");
        return res.json();
      })
      .then((body: TrustResponse) => {
        if (!cancelled && typeof body?.score === "number") setData(body);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <TrustCard score={0} loading={false} explanation={[{ kind: "neutral", text: error }]} />;
  }

  return (
    <TrustCard
      score={data?.score ?? 0}
      trajectoryLabel={data?.trajectoryLabel}
      explanation={data?.explanation}
      badges={data?.badges}
      loading={loading}
    />
  );
}
