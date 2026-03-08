"use client";

import { useEffect, useState } from "react";

interface TrustBadgeProps {
  profileId: string;
  /** When true, compact styling for iframe embed */
  embed?: boolean;
}

export function TrustBadge({ profileId, embed }: TrustBadgeProps) {
  const [data, setData] = useState<{
    trustScore: number;
    verificationCount: number;
    confidenceScore?: number;
    tier?: string;
  } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/trust/public/${encodeURIComponent(profileId)}`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { trustScore?: number; verificationCount?: number; confidenceScore?: number; tier?: string }) => {
        if (!cancelled)
          setData({
            trustScore: typeof d.trustScore === "number" ? d.trustScore : 0,
            verificationCount:
              typeof d.verificationCount === "number" ? d.verificationCount : 0,
            confidenceScore: typeof d.confidenceScore === "number" ? d.confidenceScore : 0,
            tier: typeof d.tier === "string" ? d.tier : undefined,
          });
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [profileId]);

  if (error) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm text-slate-500">
        Trust score unavailable
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 text-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div
      className={
        embed
          ? "rounded-xl border-2 border-blue-200 bg-white p-4 shadow-sm"
          : "rounded-xl border-2 border-blue-200 bg-white p-6 shadow-sm"
      }
    >
      <p
        className={
          embed
            ? "text-xs font-medium text-blue-600 mb-1"
            : "text-sm font-medium text-blue-600 mb-2"
        }
      >
        WorkVouch Trust Score
      </p>
      <p
        className={
          embed
            ? "text-2xl font-bold text-slate-900"
            : "text-4xl font-bold text-slate-900"
        }
      >
        {data.trustScore}
      </p>
      <p
        className={
          embed
            ? "text-xs text-slate-600 mt-1"
            : "text-sm text-slate-600 mt-2"
        }
      >
        Verified by {data.verificationCount} coworker
        {data.verificationCount !== 1 ? "s" : ""}
      </p>
      {data.tier && (
        <p
          className={
            embed
              ? "text-xs font-medium text-blue-600 mt-1"
              : "text-sm font-medium text-blue-600 mt-2"
          }
        >
          {data.tier}
        </p>
      )}
    </div>
  );
}
