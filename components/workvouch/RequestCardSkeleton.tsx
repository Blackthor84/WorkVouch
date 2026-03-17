"use client";

import { cn } from "@/lib/utils";

export function RequestCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/80 bg-white p-5 animate-pulse",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 shrink-0 rounded-full bg-slate-200" />
          <div className="space-y-2 min-w-0 flex-1">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-100" />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="h-10 w-20 rounded-xl bg-slate-200" />
          <div className="h-10 w-16 rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
