"use client";

import { useEffect, useState } from "react";
import { TrustCard } from "@/components/trust/TrustCard";
import { WvCard, WvErrorState, WvLoadingState } from "@/components/wv";
import type { TrustExplanationLine, TrustBadge } from "@/lib/trust/trustExplanation";

type TrustApiPayload = {
  score: number;
  band: string;
  trajectoryLabel: string;
  explanation: TrustExplanationLine[];
  badges: TrustBadge[];
};

type Props = {
  profileId: string;
  /** Server-rendered score shown while loading or if API fails */
  fallbackScore?: number;
  compact?: boolean;
};

export function TrustCardEmployerView({ profileId, fallbackScore = 0, compact }: Props) {
  const [data, setData] = useState<TrustApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/trust/${profileId}`, { credentials: "include" })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((body as { error?: string }).error ?? "Trust data unavailable");
        }
        return body as TrustApiPayload;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Trust data unavailable");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  if (loading) {
    return (
      <WvCard padding="lg">
        <WvLoadingState label="Loading trust score…" />
      </WvCard>
    );
  }

  if (error || !data) {
    return (
      <TrustCard
        score={fallbackScore}
        loading={false}
        compact={compact}
        explanation={[
          {
            kind: "neutral",
            text: error ?? "Trust breakdown unavailable. Score shown from verified records.",
          },
        ]}
      />
    );
  }

  return (
    <TrustCard
      score={data.score}
      trajectoryLabel={data.trajectoryLabel}
      explanation={data.explanation}
      badges={data.badges}
      compact={compact}
    />
  );
}
