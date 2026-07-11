"use client";

import { cn } from "@/lib/utils";

export function RequestCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-wv-border bg-wv-surface p-5 animate-pulse",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 shrink-0 rounded-full bg-white/10" />
          <div className="space-y-2 min-w-0 flex-1">
            <div className="h-4 w-40 rounded bg-white/10" />
            <div className="h-3 w-24 rounded bg-white/5" />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="h-10 w-20 rounded-xl bg-white/10" />
          <div className="h-10 w-16 rounded-xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
