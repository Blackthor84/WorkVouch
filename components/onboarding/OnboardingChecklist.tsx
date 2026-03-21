"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ONBOARDING_TRUST_REVIEWED_KEY,
  getEliteChecklistItems,
  getEliteCompletionPercent,
  type EliteChecklistInput,
} from "@/lib/onboarding/guidedOnboarding";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils";

type Props = {
  jobsCount: number;
  matchesCount: number;
  referenceCount: number;
  profileBasicsComplete: boolean;
  verifiedByCoworkers: number;
  variant?: "full" | "compact";
};

export function OnboardingChecklist({
  jobsCount,
  matchesCount,
  referenceCount,
  profileBasicsComplete,
  verifiedByCoworkers,
  variant = "full",
}: Props) {
  const [trustSeen, setTrustSeen] = useState(false);

  useEffect(() => {
    try {
      setTrustSeen(localStorage.getItem(ONBOARDING_TRUST_REVIEWED_KEY) === "1");
    } catch {
      setTrustSeen(false);
    }
  }, []);

  const input: EliteChecklistInput = useMemo(
    () => ({
      jobsCount,
      matchesCount,
      referenceCount,
      profileBasicsComplete,
      verifiedByCoworkers,
      trustDashboardSeen: trustSeen,
    }),
    [jobsCount, matchesCount, referenceCount, profileBasicsComplete, verifiedByCoworkers, trustSeen]
  );

  const items = useMemo(() => getEliteChecklistItems(input), [input]);
  const pct = getEliteCompletionPercent(items);

  if (variant === "compact") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          Setup {pct}% complete ·{" "}
          <Link href="/dashboard" className="text-blue-600 hover:underline dark:text-blue-400">
            checklist on dashboard
          </Link>
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label="Onboarding checklist"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Your first wins</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Skippable — finish when you&apos;re ready. Tap any step to continue.
          </p>
        </div>
        <p className="text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400">{pct}% complete</p>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                item.done
                  ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                  : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100"
              )}
            >
              <CheckCircleIcon
                className={cn("h-5 w-5 shrink-0", item.done ? "text-emerald-600" : "text-slate-300 dark:text-slate-600")}
                aria-hidden
              />
              <span className={cn("font-medium", item.done && "line-through opacity-80")}>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
