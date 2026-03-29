import Link from "next/link";
import type { DashboardMatchPreview } from "@/lib/actions/dashboard/getDashboardHome";
import { cn } from "@/lib/utils";

function statusStyles(status: string) {
  const s = status.toLowerCase();
  if (s === "confirmed" || s === "accepted")
    return "bg-emerald-50 text-emerald-800 ring-emerald-600/10 dark:bg-emerald-950/50 dark:text-emerald-200";
  if (s === "pending")
    return "bg-amber-50 text-amber-900 ring-amber-600/10 dark:bg-amber-950/40 dark:text-amber-100";
  return "bg-slate-100 text-slate-700 ring-slate-500/10 dark:bg-slate-800 dark:text-slate-200";
}

export function DashboardMatchesSection({ matches }: { matches: DashboardMatchPreview[] }) {
  return (
    <section aria-label="Coworker matches" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent matches</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">People you overlapped with at work</p>
        </div>
        <Link
          href="/coworker-matches"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          View all →
        </Link>
      </div>

      {matches.length === 0 ? (
        <div
          className={cn(
            "rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center",
            "dark:border-slate-700 dark:bg-slate-900/40"
          )}
        >
          <p className="font-semibold text-slate-900 dark:text-white">No matches yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
            Add a job with accurate dates so we can find coworkers you actually worked with.
          </p>
          <Link
            href="/jobs/new"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Add job
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {matches.map((m) => (
            <li
              key={m.id}
              className={cn(
                "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm",
                "dark:border-slate-800 dark:bg-slate-900/60"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-900 dark:text-white">{m.otherUserName}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {m.company}
                    <span className="text-slate-400 dark:text-slate-500">
                      {" "}
                      · {m.year ?? new Date(m.createdAt).getFullYear()}
                    </span>
                  </p>
                  <span
                    className={cn(
                      "mt-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset",
                      statusStyles(m.status)
                    )}
                  >
                    {m.status}
                  </span>
                </div>
              </div>
              <Link
                href="/coworker-matches"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Request reference
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
