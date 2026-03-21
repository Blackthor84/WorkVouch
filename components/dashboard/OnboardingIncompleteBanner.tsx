import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export function OnboardingIncompleteBanner({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-4 shadow-sm dark:from-blue-950/40 dark:to-indigo-950/30 dark:border-blue-800/60">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-blue-950 dark:text-blue-100">Keep building your trust profile</p>
          <p className="text-xs text-blue-900/80 dark:text-blue-200/90 mt-1">
            Your score is live — add a job, confirm matches, and get a coworker verification so it reflects real reputation.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center justify-center gap-2 shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Continue setup
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
