"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GUIDED_ONBOARDING_SKIPPED_KEY,
  getGuidedStep,
  type GuidedOnboardingStats,
} from "@/lib/onboarding/guidedOnboarding";
import {
  BriefcaseIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  MapIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

const CELEBRATION_DEFAULT = "Nice — you're building your profile";

const celebrateCopy: Record<string, string> = {
  job: CELEBRATION_DEFAULT,
  matches: "Great — you're connecting with coworkers. Keep it going!",
  review: "Awesome — reviews are what make your trust score meaningful.",
  progress: CELEBRATION_DEFAULT,
};

const ROADMAP_STEPS = [
  {
    n: 1,
    title: "Work history",
    hint: "Add your work history to start building your trust profile.",
  },
  {
    n: 2,
    title: "Verification",
    hint: "Get verified by coworkers or supervisors you actually worked with.",
  },
  {
    n: 3,
    title: "Trust & insights",
    hint: "Review your trust score and activity on the dashboard.",
  },
  {
    n: 4,
    title: "Matches",
    hint: "Start connecting with coworker matches from overlapping jobs.",
  },
] as const;

export function GuidedOnboardingClient({
  stats,
  firstName,
  profileBasicsComplete,
  verifiedByCoworkers,
}: {
  stats: GuidedOnboardingStats;
  firstName: string;
  profileBasicsComplete: boolean;
  verifiedByCoworkers: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = useMemo(() => getGuidedStep(stats), [stats]);
  const [celebration, setCelebration] = useState<string | null>(null);

  const celebrateKey = searchParams.get("celebrate")?.trim() ?? "";

  useEffect(() => {
    if (!celebrateKey) return;
    setCelebration(celebrateCopy[celebrateKey] ?? CELEBRATION_DEFAULT);
    const t = setTimeout(() => setCelebration(null), 6000);
    return () => clearTimeout(t);
  }, [celebrateKey]);

  function handleSkip() {
    try {
      localStorage.setItem(GUIDED_ONBOARDING_SKIPPED_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    router.push("/dashboard");
  }

  const stepNum = step === "complete" ? 3 : step;
  const pct = (stepNum / 3) * 100;

  const steps: {
    id: 1 | 2 | 3;
    title: string;
    blurb: string;
    icon: typeof BriefcaseIcon | typeof UserGroupIcon | typeof ChatBubbleLeftRightIcon;
    href: string;
    cta: string;
  }[] = [
    {
      id: 1,
      title: "Add your first job",
      blurb:
        "WorkVouch scores real work history. Add where you worked and when — we’ll help you find overlapping coworkers next.",
      icon: BriefcaseIcon,
      href: "/jobs/new?from=onboarding",
      cta: "Add your first job",
    },
    {
      id: 2,
      title: "Find coworkers",
      blurb:
        "Matches come from the same employer and overlapping dates (or invites). Add accurate dates and check matches — confirm people you actually worked with.",
      icon: UserGroupIcon,
      href: "/coworker-matches?from=onboarding",
      cta: "Find coworkers",
    },
    {
      id: 3,
      title: "Get your first review",
      blurb:
        "Request a reference from a match or coworker. One solid review unlocks your reputation graph and boosts trust.",
      icon: ChatBubbleLeftRightIcon,
      href: "/references/request?from=onboarding",
      cta: "Request a reference",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 pb-8 sm:pb-12 pt-2 sm:pt-4">
        <header className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2">
            Step {stepNum} of 3
          </p>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <h1 className="mt-6 text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Let&apos;s set up your trust profile, {firstName}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-lg">
            Three quick steps so employers instantly see your value.
          </p>
        </header>

        {celebration && (
          <div
            role="status"
            className="mb-8 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-950 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
          >
            <SparklesIcon className="h-8 w-8 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden />
            <p className="font-semibold text-lg leading-snug">{celebration}</p>
          </div>
        )}

        <div
          className="mb-8 rounded-2xl border border-indigo-200/80 bg-indigo-50/90 px-4 py-4 dark:border-indigo-900/60 dark:bg-indigo-950/30"
          role="note"
        >
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-100">
            <MapIcon className="h-5 w-5 shrink-0" aria-hidden />
            <p className="text-sm font-bold">Your roadmap (big picture)</p>
          </div>
          <ol className="mt-3 space-y-2 text-sm text-indigo-950/90 dark:text-indigo-100/90 list-decimal list-inside">
            {ROADMAP_STEPS.map((s) => (
              <li key={s.n}>
                <span className="font-semibold">{s.title}:</span> {s.hint}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-indigo-900/75 dark:text-indigo-200/80">
            Below are your next actions — only one is active at a time. Profile basics:{" "}
            {profileBasicsComplete ? "looking good" : "add name + a short bio when you can"} · Verifications so far:{" "}
            {verifiedByCoworkers > 0 || stats.referenceCount > 0
              ? `${Math.max(verifiedByCoworkers, stats.referenceCount)} source(s)`
              : "none yet (that's OK)"}
            .
          </p>
        </div>

        <ul className="space-y-6">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone =
              (s.id === 1 && stats.jobsCount >= 1) ||
              (s.id === 2 && stats.matchesCount >= 1) ||
              (s.id === 3 && stats.referenceCount >= 1);

            return (
              <li
                key={s.id}
                className={cn(
                  "rounded-2xl border p-6 sm:p-8 shadow-md transition-all bg-white dark:bg-slate-900/80",
                  isActive
                    ? "ring-2 ring-blue-500 border-blue-200 dark:border-blue-800 scale-[1.01]"
                    : "border-slate-200/80 dark:border-slate-700 opacity-90",
                  isDone && "border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                      isDone
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200"
                        : isActive
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    )}
                  >
                    <Icon className="h-7 w-7" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{s.title}</h2>
                      {isDone && (
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                          Done
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">{s.blurb}</p>
                    {isActive && !isDone && (
                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                          href={s.href}
                          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
                        >
                          {s.cta}
                        </Link>
                        <button
                          type="button"
                          onClick={() => router.refresh()}
                          className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                        >
                          Refresh progress
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-5 dark:border-slate-600 dark:bg-slate-900/40">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Prefer to explore first? You can finish anytime — we&apos;ll remind you on your dashboard.
          </p>
          <div className="flex gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSkip}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Skip for now
            </button>
            <Link
              href="/dashboard"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
    </div>
  );
}
