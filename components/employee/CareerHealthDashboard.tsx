"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export type CareerHealthData = {
  employmentStability: number;
  referenceStrength: number;
  documentationCompleteness: number;
  credentialValidation: number;
  disputeResolutionHistory: number;
};

const SECTIONS: {
  key: keyof CareerHealthData;
  title: string;
  explanation: string;
  improvementTip: string;
}[] = [
  {
    key: "employmentStability",
    title: "Employment Stability",
    explanation: "Based on average tenure length across your verified positions.",
    improvementTip: "Add more job history with accurate dates to strengthen this.",
  },
  {
    key: "referenceStrength",
    title: "Reference Strength",
    explanation: "Based on how often coworkers respond to your reference requests.",
    improvementTip: "Request references from coworkers and follow up on pending requests.",
  },
  {
    key: "documentationCompleteness",
    title: "Documentation Completeness",
    explanation: "Based on how many of your positions are verified.",
    improvementTip: "Complete verification for each job to improve this.",
  },
  {
    key: "credentialValidation",
    title: "Credential Validation",
    explanation: "Based on verified certifications and credentials on file.",
    improvementTip: "Upload and verify licenses or certifications where applicable.",
  },
  {
    key: "disputeResolutionHistory",
    title: "Dispute Resolution History",
    explanation: "Based on resolved vs unresolved disputes with employers.",
    improvementTip: "Resolve any open disputes with employers to improve this.",
  },
];

const LOW_THRESHOLD = 60;

function barColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-slate-400 dark:bg-slate-500";
  return "bg-slate-300 dark:bg-slate-600";
}

export function CareerHealthDashboard() {
  const [data, setData] = useState<CareerHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/user/career-health", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((body: CareerHealthData) => {
        if (!cancelled) setData(body);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-[20px] border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <h2 className="text-lg font-semibold text-[#1E293B] dark:text-slate-200">Career Health Overview</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-[20px] border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <h2 className="text-lg font-semibold text-[#1E293B] dark:text-slate-200">Career Health Overview</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {error ? "Unable to load metrics. Try again later." : "Complete your profile and verifications to see career health metrics."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
      <h2 className="text-lg font-semibold text-[#1E293B] dark:text-slate-200">Career Health Overview</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Growth-focused metrics. Improve any area to strengthen your profile.
      </p>

      <ul className="mt-6 space-y-5">
        {SECTIONS.map(({ key, title, explanation, improvementTip }) => {
          const score = data[key];
          const isLow = score < LOW_THRESHOLD;
          return (
            <li key={key} className="border-b border-slate-200 pb-5 last:border-0 last:pb-0 dark:border-slate-700">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[#1E293B] dark:text-slate-200">{title}</span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{score}/100</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={cn("h-full rounded-full transition-[width] duration-500", barColor(score))}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{explanation}</p>
              {isLow && (
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">{improvementTip}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
