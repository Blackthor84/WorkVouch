"use client";

import { ghPanel } from "./panel-theme";

export function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-md bg-[#e8ecea]" />
      ))}
    </div>
  );
}

export function PanelHeaderSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 animate-pulse rounded bg-[#e8ecea]" />
        <div className="h-8 w-8 animate-pulse rounded bg-[#e8ecea]" />
      </div>
      <div className="h-20 animate-pulse rounded-lg bg-[#e8ecea]" />
      <div className="h-32 animate-pulse rounded-lg bg-[#e8ecea]" />
    </div>
  );
}

export function PanelSectionSkeleton({ label = "Loading section…" }: { label?: string }) {
  return (
    <div className={ghPanel.card} role="status" aria-live="polite" aria-label={label}>
      <PanelSkeleton rows={2} />
    </div>
  );
}

export function PanelTrustSkeleton() {
  return (
    <div className={`${ghPanel.card} ${ghPanel.cardPadding}`} role="status" aria-live="polite" aria-label="Loading trust score">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 animate-pulse rounded-full bg-[#e8ecea]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-[#e8ecea]" />
          <div className="h-6 w-16 animate-pulse rounded bg-[#e8ecea]" />
        </div>
      </div>
    </div>
  );
}
