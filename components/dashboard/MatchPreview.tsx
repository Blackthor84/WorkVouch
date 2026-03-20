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
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Matches</h2>
        <p className="text-sm text-slate-500 mt-2">No coworker matches yet. Add overlapping jobs to get matched.</p>
        <Link
          href={viewAllHref}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Find coworkers
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-700">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent matches</h2>
      <ul className="mt-4 space-y-3">
        {matches.map((m) => (
          <li
            key={m.id}
            className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:bg-slate-800/50 dark:border-slate-700"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-white truncate">{m.otherUserName}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{m.company}</p>
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
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
      >
        View all matches
        <span aria-hidden>👉</span>
      </Link>
    </div>
  );
}
