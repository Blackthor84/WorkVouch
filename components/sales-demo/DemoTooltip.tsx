"use client";

import { useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { TOOLTIPS, type TooltipKey } from "@/lib/demo/sales-demo-data";

type DemoTooltipProps = {
  tooltipKey: TooltipKey;
  className?: string;
};

export function DemoTooltip({ tooltipKey, className }: DemoTooltipProps) {
  const [open, setOpen] = useState(false);
  const tip = TOOLTIPS[tooltipKey];

  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <button
        type="button"
        aria-label={`About ${tip.title}`}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <InformationCircleIcon className="h-4 w-4" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-xl"
        >
          <span className="block text-xs font-bold text-gray-900">{tip.title}</span>
          <span className="mt-1 block text-xs leading-relaxed text-gray-600">
            {tip.body}
          </span>
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-white" />
        </span>
      )}
    </span>
  );
}

export function DemoTooltipLabel({
  label,
  tooltipKey,
}: {
  label: string;
  tooltipKey: TooltipKey;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      <DemoTooltip tooltipKey={tooltipKey} />
    </span>
  );
}
