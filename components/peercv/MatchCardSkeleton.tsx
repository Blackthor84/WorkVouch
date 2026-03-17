"use client";

import { cn } from "@/lib/utils";

export function MatchCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white p-5 shadow-sm animate-pulse",
        className
      )}
    >
      <div className="flex justify-between items-center">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="h-5 w-32 rounded bg-slate-200" />
          <div className="h-4 w-40 rounded bg-slate-100" />
        </div>
        <div className="h-7 w-16 rounded-full bg-slate-100 shrink-0 ml-3" />
      </div>
      <div className="mt-4 h-10 w-full rounded-xl bg-slate-200" />
    </div>
  );
}
