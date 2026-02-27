"use client";

export type DockMode = "reality" | "decide" | "signals" | "scenarios" | "more";

const DOCK_LABELS: Record<DockMode, string> = {
  reality: "Reality",
  decide: "Decide",
  signals: "Signals",
  scenarios: "Scenarios",
  more: "More",
};

type Props = {
  activeMode: DockMode | null;
  onModeOpen: (mode: DockMode) => void;
  onModeClose: () => void;
};

export function ActionDock({ activeMode, onModeOpen, onModeClose }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around gap-1 border-t border-slate-200 bg-white/95 backdrop-blur safe-area-inset-bottom py-2"
      aria-label="Action dock"
    >
      {(Object.keys(DOCK_LABELS) as DockMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => (activeMode === mode ? onModeClose() : onModeOpen(mode))}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeMode === mode ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-100"
          }`}
          aria-pressed={activeMode === mode}
          aria-label={DOCK_LABELS[mode]}
        >
          <span className="text-lg" aria-hidden>
            {mode === "reality" && "👤"}
            {mode === "decide" && "⚖️"}
            {mode === "signals" && "📡"}
            {mode === "scenarios" && "📋"}
            {mode === "more" && "⋯"}
          </span>
          <span>{DOCK_LABELS[mode]}</span>
        </button>
      ))}
    </nav>
  );
}
