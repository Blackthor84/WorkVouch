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
 * Single Central Canvas: the ONLY large content region in the lab.
 * - After any action (button, preset, decision, fork, rewind), the Canvas shows
 *   the Simulation Command Center — users never hunt to see what happened.
 * - SCC is the default and authoritative result surface.
 * - Charts, tables, and graphs below are secondary and contextual.
 */
export function LabCanvas({ sccProps, activeMode, modeContent, footer }: Props) {
  return (
    <main
      className="flex min-w-0 flex-1 flex-col overflow-auto bg-white"
      aria-label="Central canvas — authoritative result surface"
    >
      <div className="flex flex-col gap-6 p-4">
        {/* Authoritative result surface: updates on every action; no other panel competes. */}
        <section aria-label="Simulation Command Center — default result view">
          <p className="text-xs text-slate-500 mb-2">
            Results appear here after every action. Timeline and metrics update automatically.
          </p>
          <SimulationCommandCenter
            {...sccProps}
            showDeltaInspector={false}
          />
        </section>

        {/* Secondary, contextual views — for exploration and analysis only. */}
        <section
          className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
          aria-label={`Contextual view: ${activeMode}`}
        >
          <h3 className="text-sm font-medium text-slate-500 mb-3">Contextual view</h3>
          {modeContent[activeMode]}
        </section>
        {footer}
      </div>
    </main>
  );
}
