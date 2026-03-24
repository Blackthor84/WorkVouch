import Link from "next/link";
import type { DashboardMatchPreview as MatchRow } from "@/lib/actions/dashboard/getDashboardHome";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "confirmed" || s === "accepted")
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
  if (s === "pending")
    return "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

export function MatchPreview({ matches, viewAllHref = "/coworker-matches" }: { matches: MatchRow[]; viewAllHref?: string }) {
  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Matches</h2>
        <p className="text-base font-semibold text-gray-900 dark:text-white">
          Add a coworker to get your first vouch
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add jobs with accurate dates so we can surface people you overlapped with—then request a vouch from matches.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/jobs/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Add a job
          </Link>
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            Find coworkers
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent matches</h2>
      <ul className="flex flex-col gap-3">
        {matches.map((m) => (
          <li
            key={m.id}
            className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{m.otherUserName}</p>
                <p className="truncate text-sm text-gray-600 dark:text-gray-400">{m.company}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                  statusBadge(m.status)
                )}
              >
                {m.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <Link
        href={viewAllHref}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow transition-colors hover:bg-blue-700"
      >
        View all matches
        <span aria-hidden>👉</span>
      </Link>
      </div>
    </div>
  );
}
