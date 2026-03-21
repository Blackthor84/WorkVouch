import type { ReactNode } from "react";
import Link from "next/link";
import { LightBulbIcon } from "@heroicons/react/24/outline";

type Props = {
  jobsCount: number;
  referenceCount: number;
  verifiedByCoworkers: number;
  matchesCount: number;
  profileStrengthPct: number;
};

/**
 * Small contextual tips — no modals, skippable by scrolling past.
 */
export function SmartOnboardingNudges({
  jobsCount,
  referenceCount,
  verifiedByCoworkers,
  matchesCount,
  profileStrengthPct,
}: Props) {
  const nudges: { key: string; body: ReactNode }[] = [];

  if (jobsCount < 1) {
    nudges.push({
      key: "job",
      body: (
        <>
          <strong className="font-semibold text-slate-800 dark:text-slate-100">Add your first job</strong> to unlock
          coworker matches — we match on real employment overlap.
        </>
      ),
    });
  }

  if (jobsCount >= 1 && referenceCount < 1 && verifiedByCoworkers < 1) {
    nudges.push({
      key: "verify",
      body: (
        <>
          <strong className="font-semibold text-slate-800 dark:text-slate-100">Request a coworker verification</strong>{" "}
          to increase trust — matches can leave a quick review.
        </>
      ),
    });
  }

  if (jobsCount >= 1 && matchesCount < 1) {
    nudges.push({
      key: "matches",
      body: (
        <>
          <strong className="font-semibold text-slate-800 dark:text-slate-100">No matches yet?</strong> Accurate dates
          on your jobs help us find overlapping coworkers.
        </>
      ),
    });
  }

  if (profileStrengthPct > 0 && profileStrengthPct < 50 && jobsCount >= 1) {
    nudges.push({
      key: "confidence",
      body: (
        <>
          <strong className="font-semibold text-slate-800 dark:text-slate-100">Boost confidence:</strong> add a short bio
          and recent activity so your profile feels complete.
        </>
      ),
    });
  }

  if (nudges.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="flex gap-3">
        <LightBulbIcon className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden />
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          {nudges.map((n) => (
            <li key={n.key}>{n.body}</li>
          ))}
        </ul>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
        {jobsCount < 1 && (
          <Link href="/jobs/new" className="text-blue-600 hover:underline dark:text-blue-400">
            Add job →
          </Link>
        )}
        {(referenceCount < 1 || verifiedByCoworkers < 1) && jobsCount >= 1 && (
          <Link href="/coworker-matches" className="text-blue-600 hover:underline dark:text-blue-400">
            Coworker matches →
          </Link>
        )}
        {profileStrengthPct < 50 && (
          <Link href="/profile" className="text-blue-600 hover:underline dark:text-blue-400">
            Edit profile →
          </Link>
        )}
      </div>
    </div>
  );
}
