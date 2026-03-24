import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export function DashboardProfileStrength({ percent }: { percent: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(percent)));

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profile strength</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {pct < 60
          ? "Your profile is still taking shape — finish jobs, bio, and a verification to unlock fuller trust insights."
          : "Based on jobs, bio, and references — keep going to stand out."}
      </p>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between gap-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
          <span className="text-sm font-medium tabular-nums text-gray-900 dark:text-gray-100">{pct}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <Link
        href="/profile"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-blue-600 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-900/40"
      >
        Complete profile
        <span aria-hidden>👉</span>
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
      </div>
    </div>
  );
}
