"use client";

import { cn } from "@/lib/utils";

export type DemoTab = "worker" | "employer" | "advertiser";

const TABS: { id: DemoTab; label: string }[] = [
  { id: "worker", label: "Worker Experience" },
  { id: "employer", label: "Employer Intelligence" },
  { id: "advertiser", label: "Advertiser ROI" },
];

interface DemoTabsProps {
  tab: DemoTab;
  setTab: (tab: DemoTab) => void;
}

export function DemoTabs({ tab, setTab }: DemoTabsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTab(t.id)}
          className={cn(
            "px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 ease-in-out",
            tab === t.id
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
