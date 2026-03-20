import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  accent = "slate",
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: "slate" | "blue" | "emerald" | "amber";
  className?: string;
}) {
  const ring =
    accent === "blue"
      ? "ring-blue-100 dark:ring-blue-900/40"
      : accent === "emerald"
        ? "ring-emerald-100 dark:ring-emerald-900/40"
        : accent === "amber"
          ? "ring-amber-100 dark:ring-amber-900/40"
          : "ring-slate-100 dark:ring-slate-700";

  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-700 ring-1",
        ring,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <div className="mt-2 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</div>
        </div>
        {icon ? <div className="shrink-0 text-slate-400 dark:text-slate-500">{icon}</div> : null}
      </div>
    </div>
  );
}
