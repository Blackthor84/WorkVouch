import Link from "next/link";
import type { DashboardActivityItem } from "@/lib/actions/dashboard/getDashboardHome";
import { cn } from "@/lib/utils";

function variantStyles(v: DashboardActivityItem["variant"]) {
  switch (v) {
    case "match":
      return "bg-blue-50 border-blue-100 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-100";
    case "review":
      return "bg-emerald-50 border-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-100";
    case "request":
      return "bg-amber-50 border-amber-100 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-100";
    default:
      return "bg-slate-50 border-slate-100 text-slate-800 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-100";
  }
}

function dotClass(v: DashboardActivityItem["variant"]) {
  switch (v) {
    case "match":
      return "bg-blue-500";
    case "review":
      return "bg-emerald-500";
    case "request":
      return "bg-amber-500";
    default:
      return "bg-slate-400";
  }
}

export function ActivityFeed({ items }: { items: DashboardActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center dark:border-slate-700 dark:bg-slate-900/30">
        <div className="flex flex-col items-center gap-3">
        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Kick things off—your activity feed fills in as you vouch and get vouched
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
          Add a job, find overlapping coworkers, and request a vouch. Matches, requests, and reviews show up here.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/jobs/new"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Add a job
          </Link>
          <Link
            href="/coworker-matches"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:hover:bg-slate-800"
          >
            Find coworkers
          </Link>
        </div>
        </div>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            "flex gap-3 rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900",
            variantStyles(item.variant)
          )}
        >
          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dotClass(item.variant))} aria-hidden />
          <div className="min-w-0 flex-1 flex flex-col gap-2">
            <p className="text-sm font-medium leading-snug text-inherit">{item.message}</p>
            <p className="text-xs tabular-nums opacity-70">
              {new Date(item.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
