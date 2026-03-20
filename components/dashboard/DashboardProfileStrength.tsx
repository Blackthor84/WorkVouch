import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export function DashboardProfileStrength({ percent }: { percent: number }) {
  const pct = Math.min(100, Math.max(0, Math.round(percent)));

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-700">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profile strength</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Based on jobs, bio, and references — keep going to stand out.
      </p>
      <div className="mt-4">
        <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-200">
          <span>Progress</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
        <div className="mt-2 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <Link
        href="/profile"
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-blue-600 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-500 dark:hover:bg-blue-900/40"
      >
        Complete profile
        <span aria-hidden>👉</span>
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
