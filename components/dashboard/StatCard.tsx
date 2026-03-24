import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <div className="text-2xl font-semibold tabular-nums text-gray-900 dark:text-white">{value}</div>
        </div>
        {icon ? <div className="shrink-0 text-gray-400 dark:text-gray-500">{icon}</div> : null}
      </div>
    </div>
  );
}
