"use client";

import { useState } from "react";
import type { SimulationDelta, EngineOutputs } from "@/lib/trust/types";
import type { SimulationAction } from "@/lib/trust/simulationActions";
import type { LabAuditEntry } from "./auditTypes";
import { AuditLogPanel } from "./AuditLogPanel";
import { LabDebugPanel } from "./LabDebugPanel";

type Props = {
  lastAction: SimulationAction | null;
  lastDelta: SimulationDelta | null;
  lastEngineOutputs: EngineOutputs | null | undefined;
  snapshotCount: number;
  universeId: string | null;
  auditEntries: LabAuditEntry[];
  defaultCollapsed?: boolean;
};

export function DeepDiveDrawer({
  lastAction,
  lastDelta,
  lastEngineOutputs,
  snapshotCount,
  universeId,
  auditEntries,
  defaultCollapsed = true,
}: Props) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [deltaRawExpanded, setDeltaRawExpanded] = useState(false);

  return (
    <div
      className={`relative flex flex-shrink-0 border-l border-slate-200 bg-slate-50 transition-all duration-200 ${
        collapsed ? "w-12" : "w-[380px] min-w-[320px] max-w-[90vw]"
      }`}
      aria-label="Deep dive — delta inspector, audit log, debug"
    >
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex h-full w-full flex-col items-center justify-center gap-1 py-4 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-400"
          aria-expanded={false}
          title="Open Deep Dive"
        >
          <span className="text-[10px] font-medium uppercase tracking-wider">Deep</span>
          <span className="text-[10px] font-medium uppercase tracking-wider">Dive</span>
          <span className="text-slate-400 mt-1">◀</span>
        </button>
      ) : (
        <>
          <div className="flex flex-col gap-4 p-4 overflow-y-auto h-full">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-lg font-semibold text-slate-900">Deep Dive</h2>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                title="Close Deep Dive"
                aria-label="Close Deep Dive"
              >
                ◀
              </button>
            </div>

            {/* Delta Inspector */}
            <section className="rounded-lg border border-slate-200 bg-white p-3">
              <h3 className="text-sm font-semibold text-slate-800 mb-2">Delta inspector</h3>
              {lastDelta ? (
                <>
                  <div className="text-sm text-slate-700 space-y-1">
                    {lastDelta.addedReviews && lastDelta.addedReviews.length > 0 && (
                      <div>Added: {lastDelta.addedReviews.length} signal(s)</div>
                    )}
                    {lastDelta.removedReviewIds && lastDelta.removedReviewIds.length > 0 && (
                      <div>Removed: {lastDelta.removedReviewIds.length} signal(s)</div>
                    )}
                    {lastDelta.thresholdOverride != null && (
                      <div>Threshold override: {lastDelta.thresholdOverride}</div>
                    )}
                    {!lastDelta.addedReviews?.length &&
                      !lastDelta.removedReviewIds?.length &&
                      lastDelta.thresholdOverride == null && (
                        <div>No review mutations (metadata or no-op commit).</div>
                      )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeltaRawExpanded((e) => !e)}
                    className="mt-2 text-xs text-slate-600 underline hover:text-slate-800"
                  >
                    {deltaRawExpanded ? "Hide raw delta" : "Show raw delta"}
                  </button>
                  {deltaRawExpanded && (
                    <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-auto max-h-48">
                      {JSON.stringify(lastDelta, null, 2)}
                    </pre>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500">No delta applied yet.</p>
              )}
            </section>

            {/* Audit Log */}
            <section className="flex-shrink-0">
              <AuditLogPanel entries={auditEntries} />
            </section>

            {/* Debug */}
            <LabDebugPanel
              lastAction={lastAction}
              lastDelta={lastDelta}
              lastEngineOutputs={lastEngineOutputs}
              snapshotCount={snapshotCount}
              universeId={universeId}
              visible
            />
          </div>
        </>
      )}
    </div>
  );
}
