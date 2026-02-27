"use client";

import { SimulationCommandCenter } from "./SimulationCommandCenter";
import type { RailMode } from "./ActionRail";
import type { Snapshot } from "@/lib/trust/types";
import type { SimulationAction } from "@/lib/trust/simulationActions";
import type { SimulationDelta } from "@/lib/trust/types";
import type { UniverseContext } from "./SimulationCommandCenter";
import type { PopulationImpactSummary } from "./SimulationCommandCenter";

type SCCProps = {
  snapshot: Snapshot;
  history: Snapshot[];
  currentStep: number;
  onTimelineStep: (step: number) => void;
  lastAction: SimulationAction | null;
  lastDelta: SimulationDelta | null;
  universeContext: UniverseContext | null;
  multiverseMode: boolean;
  populationImpact?: PopulationImpactSummary | null;
  noEffectReason?: string | null;
};

type Props = {
  sccProps: SCCProps;
  activeMode: RailMode;
  modeContent: Record<RailMode, React.ReactNode>;
  footer?: React.ReactNode;
};

/**
 * Central Canvas: always shows the Simulation Command Center as the authoritative
 * result surface, then the mode-specific view below. Users never need to search
 * across panels to understand what happened.
 */
export function LabCanvas({ sccProps, activeMode, modeContent, footer }: Props) {
  return (
    <main
      className="flex min-w-0 flex-1 flex-col overflow-auto bg-white"
      aria-label="Lab canvas — command center and result view"
    >
      <div className="flex flex-col gap-6 p-4">
        {/* Authoritative result surface: after any action, SCC is here. */}
        <SimulationCommandCenter
          {...sccProps}
          showDeltaInspector={false}
        />
        {/* Mode-specific view: exploration context. */}
        <section
          className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
          aria-label={`View: ${activeMode}`}
        >
          {modeContent[activeMode]}
        </section>
        {footer}
      </div>
    </main>
  );
}
