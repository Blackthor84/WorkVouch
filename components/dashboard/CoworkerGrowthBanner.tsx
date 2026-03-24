import Link from "next/link";

export function CoworkerGrowthBanner({ matchesCount }: { matchesCount: number }) {
  if (matchesCount > 0) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-3">
      <p className="text-lg font-medium text-amber-950 dark:text-amber-100">
        Add coworkers to unlock your trust score
      </p>
      <p className="text-sm text-amber-900/85 dark:text-amber-200/90">
        Matches and peer reviews are the fastest path to a stronger reputation. Invite people you actually worked
        with.
      </p>
      <div className="flex flex-wrap gap-3">
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
    </div>
  );
}
