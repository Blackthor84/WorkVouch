"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export type CareerHealthData = {
  careerHealth: number;
  components: {
    tenure: number;
    reference: number;
    rehire: number;
    dispute: number;
    network: number;
  };
};

const SECTIONS: {
  key: keyof CareerHealthData["components"];
  title: string;
  explanation: string;
  improvementTip: string;
}[] = [
  {
    key: "tenure",
    title: "Employment Stability",
    explanation: "Based on tenure across your verified positions.",
    improvementTip: "Add more job history with accurate dates to strengthen this.",
  },
  {
    key: "reference",
    title: "Reference Strength",
    explanation: "Based on completed references from coworkers.",
    improvementTip: "Request references from coworkers and follow up on pending requests.",
  },
  {
    key: "rehire",
    title: "Rehire Likelihood",
    explanation: "Based on rehire recommendations from employers.",
    improvementTip: "Complete verifications and build positive rehire status.",
  },
  {
    key: "dispute",
    title: "Dispute Resolution",
    explanation: "Based on resolved vs open disputes with employers.",
    improvementTip: "Resolve any open disputes with employers to improve this.",
  },
  {
    key: "network",
    title: "Network Density",
    explanation: "Based on coworker connections and reference coverage.",
    improvementTip: "Connect with more coworkers and request references.",
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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/user/career-health", { credentials: "include" })
      .then((res) => res.json())
      .then((body: CareerHealthData) => {
        if (!cancelled) {
          const comp = body?.components ?? {};
          const safe: CareerHealthData = {
            careerHealth: Number(body?.careerHealth) ?? 0,
            components: {
              tenure: Number(comp.tenure) ?? 0,
              reference: Number(comp.reference) ?? 0,
              rehire: Number(comp.rehire) ?? 0,
              dispute: Number(comp.dispute) ?? 0,
              network: Number(comp.network) ?? 0,
            },
          };
          setData(safe);
        }
      })
      .catch(() => {
        if (!cancelled)
          setData({
            careerHealth: 0,
            components: { tenure: 0, reference: 0, rehire: 0, dispute: 0, network: 0 },
          });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-[20px] border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
        <h2 className="text-lg font-semibold text-[#1E293B] dark:text-slate-200">Career Health Overview</h2>
        <div className="mt-3 h-3 w-2/3 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="mt-5 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  const careerHealth = data?.careerHealth ?? 0;
  const components = data?.components ?? {
    tenure: 0,
    reference: 0,
    rehire: 0,
    dispute: 0,
    network: 0,
  };
  const isZero = careerHealth === 0;

  return (
    <div className="rounded-[20px] border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
      <h2 className="text-lg font-semibold text-[#1E293B] dark:text-slate-200">Career Health Overview</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {isZero
          ? "Building your score… Complete your profile and verifications to see career health metrics."
          : "Growth-focused metrics. Improve any area to strengthen your profile."}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="font-medium text-[#1E293B] dark:text-slate-200">
          {isZero ? "Building your score…" : "Overall"}
        </span>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{careerHealth}/100</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", barColor(careerHealth))}
          style={{ width: `${careerHealth}%` }}
        />
      </div>

      <ul className="mt-6 space-y-5">
        {SECTIONS.map(({ key, title, explanation, improvementTip }) => {
          const score = components[key] ?? 0;
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
              {isLow && score > 0 && (
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">{improvementTip}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
