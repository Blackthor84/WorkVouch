"use client";

import { ReactNode } from "react";

interface SimulationPanelProps {
  recalculateButton: ReactNode;
  children: ReactNode;
}

export function SimulationPanel({
  recalculateButton,
  children,
}: SimulationPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Sticky Recalculate at top of center column */}
      <div className="sticky top-14 z-10 -mx-1 flex-none rounded-lg border border-slate-600 bg-slate-800/95 px-3 py-2 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-200">
            Recalculate Intelligence
          </span>
          {recalculateButton}
        </div>
      </div>

      <div className="space-y-2">{children}</div>
    </div>
  );
}
