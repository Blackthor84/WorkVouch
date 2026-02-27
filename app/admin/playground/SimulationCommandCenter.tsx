"use client";

import { useState } from "react";
import type { Snapshot, SimulationDelta, EngineOutputs } from "@/lib/trust/types";
import type { SimulationAction } from "@/lib/trust/simulationActions";

export interface UniverseContext {
  name: string;
  id: string | null;
  divergencePercent?: number | null;
  instability?: number | null;
}

export interface PopulationImpactSummary {
  avgTrust: number;
  riskDelta: number;
  fragility: number;
}

type Props = {
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

function snapshotId(s: Snapshot): string {
  return `${s.timestamp}-${s.reviews.length}`;
}

function complianceStatus(score: number): string {
  if (score >= 80) return "Compliant";
  if (score >= 60) return "At risk";
  return "Breach";
}

function explainAction(action: SimulationAction | null, delta: SimulationDelta | null, prevOutputs: EngineOutputs | undefined, currOutputs: EngineOutputs | undefined): string {
  if (!action) return "No action yet. Run any lab action to see outcomes here.";
  if (!currOutputs) return "Snapshot has no engine outputs.";
  const added = delta?.addedReviews?.length ?? 0;
  const removed = delta?.removedReviewIds?.length ?? 0;
  const parts: string[] = [];
  if (added > 0) parts.push(`${added} signal(s) added`);
  if (removed > 0) parts.push(`${removed} signal(s) removed`);
  if (delta?.thresholdOverride != null) parts.push(`threshold set to ${delta.thresholdOverride}`);
  if (prevOutputs) {
    const dTrust = currOutputs.trustScore - prevOutputs.trustScore;
    const dConf = currOutputs.confidenceScore - prevOutputs.confidenceScore;
    const dDebt = currOutputs.trustDebt - prevOutputs.trustDebt;
    const dFrag = currOutputs.fragilityScore - prevOutputs.fragilityScore;
    if (dTrust !== 0) parts.push(`trust ${dTrust > 0 ? "+" : ""}${dTrust}`);
    if (dConf !== 0) parts.push(`confidence ${dConf > 0 ? "+" : ""}${dConf}`);
    if (dDebt !== 0) parts.push(`trust debt ${dDebt > 0 ? "+" : ""}${dDebt}`);
    if (dFrag !== 0) parts.push(`fragility ${dFrag > 0 ? "+" : ""}${dFrag}`);
  }
  if (delta?.metadata?.notes?.startsWith("No effect")) return delta.metadata.notes;
  return parts.length > 0 ? parts.join("; ") : "State committed (no net metric change).";
}

function engineDeltas(prev: EngineOutputs | undefined, curr: EngineOutputs): { name: string; delta: number }[] {
  if (!prev) return [];
  const out: { name: string; delta: number }[] = [];
  const keys: (keyof EngineOutputs)[] = ["trustScore", "confidenceScore", "riskScore", "fragilityScore", "trustDebt", "complianceScore", "cultureImpactScore"];
  for (const k of keys) {
    const d = curr[k] - prev[k];
    if (d !== 0) out.push({ name: k, delta: d });
  }
  return out;
}

export function SimulationCommandCenter({
  snapshot,
  history,
  currentStep,
  onTimelineStep,
  lastAction,
  lastDelta,
  universeContext,
  multiverseMode,
  populationImpact,
  noEffectReason,
}: Props) {
  const [deltaExpanded, setDeltaExpanded] = useState(false);
  const prevSnapshot = currentStep > 0 ? history[currentStep - 1] : undefined;
  const prevOutputs = prevSnapshot?.engineOutputs;
  const currOutputs = snapshot.engineOutputs;
  const compliance = currOutputs ? complianceStatus(currOutputs.complianceScore) : "—";
  const explanation = noEffectReason ?? explainAction(lastAction, lastDelta, prevOutputs, currOutputs ?? undefined);
  const deltas = currOutputs && prevOutputs ? engineDeltas(prevOutputs, currOutputs) : [];

  return (
    <section
      className="rounded-xl border-2 border-slate-300 bg-slate-50 shadow-sm p-5 space-y-4"
      aria-label="Simulation Command Center — single source of truth"
    >
      <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
        Simulation Command Center
      </h2>
      <p className="text-xs text-slate-600">
        All meaningful simulation output is shown here. Every action that produces a snapshot updates this panel.
      </p>

      {/* Current state */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-white border border-slate-200 p-2">
          <div className="text-xs text-slate-500">Active universe</div>
          <div className="font-mono text-sm font-semibold text-slate-800">
            {universeContext?.name ?? (multiverseMode ? "—" : "Single")}
          </div>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 p-2">
          <div className="text-xs text-slate-500">Timeline step</div>
          <div className="font-mono text-sm font-semibold text-slate-800">{currentStep} / {Math.max(0, history.length - 1)}</div>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 p-2">
          <div className="text-xs text-slate-500">Snapshot ID</div>
          <div className="font-mono text-xs text-slate-800 truncate" title={snapshotId(snapshot)}>{snapshotId(snapshot)}</div>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 p-2">
          <div className="text-xs text-slate-500">Compliance</div>
          <div className="text-sm font-semibold text-slate-800">{compliance}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-white border border-slate-200 p-2">
          <div className="text-xs text-slate-500">Trust score</div>
          <div className="font-mono text-sm font-semibold text-slate-800">{snapshot.trustScore}</div>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 p-2">
          <div className="text-xs text-slate-500">Confidence score</div>
          <div className="font-mono text-sm font-semibold text-slate-800">{snapshot.confidenceScore}</div>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 p-2">
          <div className="text-xs text-slate-500">Trust debt</div>
          <div className="font-mono text-sm font-semibold text-slate-800">{currOutputs?.trustDebt ?? "—"}</div>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 p-2">
          <div className="text-xs text-slate-500">Fragility</div>
          <div className="font-mono text-sm font-semibold text-slate-800">{currOutputs?.fragilityScore ?? "—"}</div>
        </div>
      </div>

      {/* Universe context */}
      {multiverseMode && universeContext && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Universe context</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            <span><strong>Name:</strong> {universeContext.name}</span>
            {universeContext.divergencePercent != null && <span><strong>Divergence:</strong> {universeContext.divergencePercent}%</span>}
            {universeContext.instability != null && <span><strong>Instability:</strong> {universeContext.instability}</span>}
          </div>
        </div>
      )}

      {/* Timeline anchor */}
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Timeline anchor</h3>
        <input
          type="range"
          min={0}
          max={Math.max(0, history.length - 1)}
          value={currentStep}
          onChange={(e) => onTimelineStep(Number(e.target.value))}
          className="w-full h-2"
        />
        <p className="text-xs text-slate-500 mt-1">
          Step {currentStep} of {history.length} — selecting a step rebinds the entire lab state.
        </p>
      </div>

      {/* Last Action Resolution */}
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Last action resolution</h3>
        <div className="space-y-2 text-sm">
          <div><strong>Action:</strong> {lastAction ? lastAction.type : "—"}</div>
          <div><strong>Actor:</strong> {lastDelta?.metadata?.actor ?? "—"}</div>
          {deltas.length > 0 && (
            <div>
              <strong>Engines affected (deltas):</strong>
              <ul className="list-disc list-inside mt-1">
                {deltas.map(({ name, delta }) => (
                  <li key={name}>{name}: {delta > 0 ? "+" : ""}{delta}</li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <strong>Explanation:</strong>{" "}
            <span className="text-slate-700">{explanation}</span>
          </div>
        </div>
      </div>

      {/* Delta Inspector */}
      <div className="rounded-lg border border-slate-200 bg-white p-3">
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
              {(!lastDelta.addedReviews?.length && !lastDelta.removedReviewIds?.length && lastDelta.thresholdOverride == null) && (
                <div>No review mutations (metadata or no-op commit).</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setDeltaExpanded((e) => !e)}
              className="mt-2 text-xs text-slate-600 underline hover:text-slate-800"
            >
              {deltaExpanded ? "Hide raw delta" : "Show raw delta"}
            </button>
            {deltaExpanded && (
              <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(lastDelta, null, 2)}
              </pre>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-500">No delta applied yet.</p>
        )}
      </div>

      {/* Population impact (when applicable) */}
      {populationImpact != null && (
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Population impact summary</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <span><strong>Avg trust:</strong> {populationImpact.avgTrust}</span>
            <span><strong>Risk delta:</strong> {populationImpact.riskDelta}</span>
            <span><strong>Fragility:</strong> {populationImpact.fragility}</span>
          </div>
        </div>
      )}

      {/* No-effect explanation */}
      {noEffectReason && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Why no measurable effect:</strong> {noEffectReason}
        </div>
      )}
    </section>
  );
}
