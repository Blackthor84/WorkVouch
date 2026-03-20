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
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/30">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No recent activity yet</p>
        <p className="text-xs text-slate-500 mt-1">Add a job and find coworkers to see matches and reviews here.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            "flex gap-3 rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md",
            variantStyles(item.variant)
          )}
        >
          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dotClass(item.variant))} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug">{item.message}</p>
            <p className="text-xs opacity-70 mt-1.5 tabular-nums">
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
