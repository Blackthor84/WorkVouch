"use client";

import { useState, useRef, useCallback } from "react";
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
};

export function DeepDiveSwipeSheet({
  lastAction,
  lastDelta,
  lastEngineOutputs,
  snapshotCount,
  universeId,
  auditEntries,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches[0].clientY > window.innerHeight - 80) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const y = e.touches[0].clientY;
    if (startY.current > 0 && y < startY.current) {
      setDragY(Math.min(0, y - startY.current));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragY < -60) setVisible(true);
    setDragY(0);
    startY.current = 0;
  }, [dragY]);

  return (
    <>
      {/* Swipe-up affordance: bottom edge */}
      <div
        className="fixed bottom-16 left-0 right-0 z-30 h-12 flex items-center justify-center bg-gradient-to-t from-slate-100/90 to-transparent pointer-events-none md:hidden"
        aria-hidden
      />
      <button
        type="button"
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow md:hidden"
        onClick={() => setVisible(true)}
        aria-label="Open Deep Dive"
      >
        Swipe up for Deep Dive
      </button>

      {visible && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-white md:hidden"
          role="dialog"
          aria-label="Deep Dive — delta, audit, debug"
          style={{ transform: dragY ? `translateY(${-dragY}px)` : undefined }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h2 className="text-lg font-semibold text-slate-900">Deep Dive</h2>
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="rounded p-2 text-slate-600 hover:bg-slate-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {lastDelta && (
              <section className="rounded-lg border border-slate-200 p-3">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Delta</h3>
                <p className="text-xs text-slate-600">
                  +{lastDelta.addedReviews?.length ?? 0} / −{lastDelta.removedReviewIds?.length ?? 0} signals
                </p>
              </section>
            )}
            <AuditLogPanel entries={auditEntries} />
            <LabDebugPanel
              lastAction={lastAction}
              lastDelta={lastDelta}
              lastEngineOutputs={lastEngineOutputs}
              snapshotCount={snapshotCount}
              universeId={universeId}
              visible
            />
          </div>
        </div>
      )}
    </>
  );
}
