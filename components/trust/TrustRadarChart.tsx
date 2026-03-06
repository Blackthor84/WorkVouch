"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

export type TrustRadarDimensions = {
  verificationCoverage: number;
  referenceCredibility: number;
  networkDepth: number;
  disputeScore: number;
  consistencyScore: number;
  recencyScore: number;
};

const LABELS: Record<keyof TrustRadarDimensions, string> = {
  verificationCoverage: "Verification",
  referenceCredibility: "References",
  networkDepth: "Network",
  disputeScore: "Disputes",
  consistencyScore: "Consistency",
  recencyScore: "Recency",
};

function toChartData(d: TrustRadarDimensions) {
  return (Object.keys(LABELS) as (keyof TrustRadarDimensions)[]).map((key) => ({
    subject: LABELS[key],
    value: typeof d[key] === "number" ? d[key] : 0,
    fullMark: 100,
  }));
}

interface TrustRadarChartProps {
  profileId?: string;
}

export function TrustRadarChart({ profileId: propProfileId }: TrustRadarChartProps) {
  const [profileId, setProfileId] = useState<string | null>(propProfileId ?? null);
  const [data, setData] = useState<TrustRadarDimensions | null>(null);
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
        const res = await fetch("/api/trust/radar/" + encodeURIComponent(id), { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load");
        const body: TrustRadarDimensions = await res.json();
        if (!cancelled) setData(body);
      } catch {
        if (!cancelled) setError("Unable to load trust radar.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [propProfileId]);

  if (loading) {
    return (
      <Card className="p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Trust Radar</h2>
        <div className="h-[280px] flex items-center justify-center">
          <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Trust Radar</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error ?? "No data."}</p>
      </Card>
    );
  }

  const chartData = toChartData(data);

  return (
    <Card className="p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Trust Radar</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Six dimensions from verification, references, network, disputes, consistency, and recency.
      </p>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 11 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
            <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} strokeWidth={2} />
            <Tooltip formatter={(value: number) => [value, "Score"]} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
