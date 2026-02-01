"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export type ProfileStrengthData = {
  tenureStability: number;
  referenceResponseRate: number;
  rehireLikelihood: number;
  employmentGapClarity: number;
  disputeResolutionStatus: number;
  fromDefaults?: boolean;
};

const LOW_THRESHOLD = 60;

const METRICS: {
  key: keyof Omit<ProfileStrengthData, "fromDefaults">;
  label: string;
  tipLow: string;
}[] = [
  {
    key: "tenureStability",
    label: "Tenure stability",
    tipLow: "Add more job history with accurate dates to strengthen this.",
  },
  {
    key: "referenceResponseRate",
    label: "Reference response rate",
    tipLow: "Request references from coworkers; follow up on pending requests.",
  },
  {
    key: "rehireLikelihood",
    label: "Rehire likelihood",
    tipLow: "Complete verifications and build positive rehire status with employers.",
  },
  {
    key: "employmentGapClarity",
    label: "Employment gap clarity",
    tipLow: "Add roles for any gaps (e.g. education, freelance) to clarify your timeline.",
  },
  {
    key: "disputeResolutionStatus",
    label: "Dispute resolution status",
    tipLow: "Resolve any open disputes with employers to improve this.",
  },
];

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/user/profile-strength", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((body: ProfileStrengthData) => {
        if (!cancelled) setData(body);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
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
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className={cn(
          "rounded-[20px] border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50",
          className
        )}
      >
        <h3 className="text-base font-semibold text-[#1E293B] dark:text-slate-200">Profile Strength</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {error ? "Unable to load metrics. Try again later." : "Add jobs and references to see your profile strength."}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-[20px] border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50",
        className
      )}
    >
      <h3 className="text-base font-semibold text-[#1E293B] dark:text-slate-200">Profile Strength</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        How employers see your verified profile. Improve any area below to strengthen your profile.
      </p>

      <ul className="mt-5 space-y-4">
        {METRICS.map(({ key, label, tipLow }) => {
          const score = data[key];
          const isLow = score < LOW_THRESHOLD;
          return (
            <li key={key}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-[#1E293B] dark:text-slate-200">{label}</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {score} · {strengthLabel(score)}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={cn("h-full rounded-full transition-[width] duration-500", barColor(score))}
                  style={{ width: `${score}%` }}
                />
              </div>
              {isLow && (
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{tipLow}</p>
              )}
            </li>
          );
        })}
      </ul>

      {data.fromDefaults && (
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Complete your job history and references to see updated strength metrics.
        </p>
      )}
    </div>
  );
}
