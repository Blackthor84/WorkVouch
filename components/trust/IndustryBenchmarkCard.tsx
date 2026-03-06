"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

type BenchmarkData = {
  industry: string;
  userScore: number;
  industryAverage: number;
  top10Percent: number;
  percentile: number;
};

interface IndustryBenchmarkCardProps {
  profileId?: string;
}

export function IndustryBenchmarkCard({ profileId: propProfileId }: IndustryBenchmarkCardProps) {
  const [profileId, setProfileId] = useState<string | null>(propProfileId ?? null);
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      let id: string | null | undefined = propProfileId;
      if (!id) {
        const meRes = await fetch("/api/user/me", { credentials: "include" });
        if (!meRes.ok || cancelled) {
          if (!cancelled) setLoading(false);
          return;
        }
        const me = (await meRes.json()) as { user?: { id?: string } };
        id = me?.user?.id ?? null;
        if (!cancelled && id) setProfileId(id);
      }
      if (!id || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/trust/benchmark/${encodeURIComponent(id)}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load");
        const body: BenchmarkData = await res.json();
        if (!cancelled) setData(body);
      } catch {
        if (!cancelled) setError("Unable to load industry benchmark.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [propProfileId]);

  if (loading) {
    return (
      <Card className="p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Industry Trust Benchmark
        </h2>
        <div className="h-10 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Industry Trust Benchmark
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Industry Trust Benchmark
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">No benchmark data.</p>
      </Card>
    );
  }

  const rankingMessage =
    data.percentile >= 0 && data.percentile <= 100
      ? `You rank higher than ${data.percentile}% of verified professionals in ${data.industry}.`
      : `Compare your trust score to others in ${data.industry}.`;

  return (
    <Card className="p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Industry Trust Benchmark
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        {data.industry}
      </p>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Your Score: <span className="font-semibold">{data.userScore}</span>
        </p>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Industry Avg: <span className="font-semibold">{Math.round(data.industryAverage)}</span>
        </p>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Top 10%: <span className="font-semibold">{Math.round(data.top10Percent)}</span>
        </p>
      </div>
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-400" title={rankingMessage}>
        {rankingMessage}
      </p>
    </Card>
  );
}
