"use client";

export type RailMode =
  | "reality"
  | "decisions"
  | "signals"
  | "scenarios"
  | "populations"
  | "adversarial";

const MODE_LABELS: Record<RailMode, string> = {
  reality: "Reality",
  decisions: "Decisions",
  signals: "Signals",
  scenarios: "Scenarios",
  populations: "Populations",
  adversarial: "Adversarial",
};

type Props = {
  activeMode: RailMode;
  onModeChange: (mode: RailMode) => void;
  modeContent: Record<RailMode, React.ReactNode>;
};

export function ActionRail({ activeMode, onModeChange, modeContent }: Props) {
  return (
    <aside
      className="flex w-72 min-w-[18rem] max-w-[22rem] flex-shrink-0 flex-col border-r border-slate-200 bg-slate-50/80"
      aria-label="Action rail — choose a mode"
    >
      <div className="border-b border-slate-200 px-3 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Mode
        </h2>
      </div>
      <nav className="flex flex-col">
        {(Object.keys(MODE_LABELS) as RailMode[]).map((mode) => {
          const isActive = activeMode === mode;
          return (
            <div key={mode} className="border-b border-slate-100">
              <button
                type="button"
                onClick={() => onModeChange(mode)}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-200/80 text-slate-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                }`}
                aria-expanded={isActive}
                aria-controls={`rail-content-${mode}`}
                id={`rail-trigger-${mode}`}
              >
                <span>{MODE_LABELS[mode]}</span>
                <span
                  className={`inline-block text-slate-400 transition-transform ${
                    isActive ? "rotate-90" : ""
                  }`}
                  aria-hidden
                >
                  ▶
                </span>
              </button>
              <div
                id={`rail-content-${mode}`}
                role="region"
                aria-labelledby={`rail-trigger-${mode}`}
                hidden={!isActive}
                className={`overflow-hidden transition-all ${
                  isActive ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="border-t border-slate-200 bg-white p-3">
                  {modeContent[mode]}
                </div>
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
