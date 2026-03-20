import Link from "next/link";

export function CoworkerGrowthBanner({ matchesCount }: { matchesCount: number }) {
  if (matchesCount > 0) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 shadow-sm dark:from-amber-950/40 dark:to-orange-950/30 dark:border-amber-800/60">
      <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
        Add coworkers to unlock your trust score
      </p>
      <p className="text-xs text-amber-900/80 dark:text-amber-200/90 mt-1">
        Matches and peer reviews are the fastest path to a stronger reputation. Invite people you actually worked
        with.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          href="/jobs/new"
          className="inline-flex rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Add job
        </Link>
        <Link
          href="/coworker-matches"
          className="inline-flex rounded-lg border border-amber-700/30 bg-white/80 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-white dark:bg-slate-900 dark:text-amber-100"
        >
          Find coworkers
        </Link>
      </div>
    </div>
  );
}
