"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { UserGroupIcon } from "@heroicons/react/24/outline";

export type DepthBand = "weak" | "moderate" | "strong";

export type TrustGraphDepthData = {
  depthScore: number;
  depthBand: DepthBand;
  connectionCount: number;
  directConnections: number;
  managerConfirmations: number;
  coworkerConnections: number;
};

const BAND_LABELS: Record<DepthBand, string> = {
  weak: "Weak",
  moderate: "Moderate",
  strong: "Strong",
};

const BAND_STYLES: Record<DepthBand, string> = {
  weak: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  moderate: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  strong: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
};

interface TrustGraphDepthCardProps {
  /** When omitted, uses current user (fetch /api/user/me then network-depth). */
  profileId?: string;
}

export function TrustGraphDepthCard({ profileId: propProfileId }: TrustGraphDepthCardProps) {
  const [profileId, setProfileId] = useState<string | null>(propProfileId ?? null);
  const [data, setData] = useState<TrustGraphDepthData | null>(null);
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
        const res = await fetch(`/api/trust/network-depth/${encodeURIComponent(id)}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load");
        const body: TrustGraphDepthData = await res.json();
        if (!cancelled) setData(body);
      } catch {
        if (!cancelled) setError("Unable to load trust graph depth.");
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
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Trust Graph Depth
        </h2>
        <div className="h-10 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Trust Graph Depth
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error ?? "Unable to load."}</p>
      </Card>
    );
  }

  const bandLabel = BAND_LABELS[data.depthBand];
  const bandStyle = BAND_STYLES[data.depthBand];

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        Trust Graph Depth
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Depth score from direct connections and manager confirmations (managers weighted 2×).
      </p>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <UserGroupIcon className="h-6 w-6 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Trust Graph Depth: {bandLabel}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Score: {data.depthScore} (0–2 weak, 3–5 moderate, 6+ strong)
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Verified Connections: {data.connectionCount}
        </p>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Manager Confirmations: {data.managerConfirmations}
        </p>
      </div>

      <div className="mt-3">
        <span className={`inline-block text-xs font-medium px-2 py-1 rounded ${bandStyle}`}>
          {bandLabel}
        </span>
      </div>
    </Card>
  );
}
