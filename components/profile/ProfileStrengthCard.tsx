"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export type ProfileStrengthData = {
  profileStrength: number;
  lastUpdated: string | null;
};

function strengthLabel(score: number): string {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Building";
  return "Room to improve";
}

function barColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-slate-400 dark:bg-slate-500";
  return "bg-slate-300 dark:bg-slate-600";
}

export interface ProfileStrengthCardProps {
  userId?: string;
  className?: string;
}

export function ProfileStrengthCard({ userId, className }: ProfileStrengthCardProps) {
  const [data, setData] = useState<ProfileStrengthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/user/profile-strength", { credentials: "include" })
      .then((res) => res.json())
      .then((body: ProfileStrengthData) => {
        if (!cancelled) {
          const safe = {
            profileStrength: Number(body?.profileStrength) ?? 0,
            lastUpdated: body?.lastUpdated ?? null,
          };
          setData(safe);
        }
      })
      .catch(() => {
        if (!cancelled) setData({ profileStrength: 0, lastUpdated: null });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return (
      <div
        className={cn(
          "rounded-[20px] border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50",
          className
        )}
      >
        <h3 className="text-base font-semibold text-[#1E293B] dark:text-slate-200">Profile Strength</h3>
        <div className="mt-3 h-3 w-3/4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  const score = data?.profileStrength ?? 0;
  const isZero = score === 0;

  return (
    <div
      className={cn(
        "rounded-[20px] border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50",
        className
      )}
    >
      <h3 className="text-base font-semibold text-[#1E293B] dark:text-slate-200">Profile Strength</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {isZero
          ? "Building your score… Add jobs and references to see your profile strength."
          : "How employers see your verified profile. Improve any area to strengthen your profile."}
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-[#1E293B] dark:text-slate-200">
            {isZero ? "Building your score…" : strengthLabel(score)}
          </span>
          <span className="text-sm text-slate-600 dark:text-slate-400">{score}/100</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className={cn("h-full rounded-full transition-[width] duration-500", barColor(score))}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {data?.lastUpdated && !isZero && (
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Updated {new Date(data.lastUpdated).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
