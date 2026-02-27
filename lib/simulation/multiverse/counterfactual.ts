/**
 * Phase 8: Counterfactual Explainer & Trust Autopsy.
 * Narrative-driven analysis. Simulation only.
 */

import type { Universe, TimelineEvent } from "./types";

export type CounterfactualResult = {
  narrative: string;
  conditions: string[];
  alternativePaths: string[];
};

/** "What had to be true for this outcome?" */
export function runCounterfactual(universe: Universe): CounterfactualResult {
  const state = universe.trustState;
  const conditions: string[] = [];
  if (state.signals.length === 0) {
    conditions.push("No signals were present.");
  } else {
    conditions.push(`${state.signals.length} signal(s) contributed to the score.`);
    const supervisor = state.signals.filter((s) => s.source === "supervisor");
    if (supervisor.length > 0) {
      conditions.push(`Supervisor weight had to be ${supervisor.reduce((a, s) => a + s.weight, 0).toFixed(1)} or higher.`);
    }
  }
  conditions.push(`Physics threshold was ${universe.physicsProfile.threshold}.`);
  const narrative =
    state.trustScore >= universe.physicsProfile.threshold
      ? `For a HIRE outcome, trust had to reach ${state.trustScore.toFixed(0)} (≥ ${universe.physicsProfile.threshold}). ${conditions.join(" ")}`
      : `For a REJECT outcome, trust stayed at ${state.trustScore.toFixed(0)} (below ${universe.physicsProfile.threshold}). ${conditions.join(" ")}`;
  return {
    narrative,
    conditions,
    alternativePaths: [
      "Add 1–2 strong supervisor signals to flip to pass.",
      "Remove the earliest negative signal to see score recovery.",
      "Lower threshold to see how many more would pass.",
    ],
  };
}

export type AutopsyResult = {
  collapsePoint: number | null;
  firstMistake: string | null;
  lastInterventionPoint: number | null;
  narrative: string;
};

/** Replay collapse events, first mistake, last intervention */
export function runTrustAutopsy(universe: Universe): AutopsyResult {
  const timeline = universe.timeline;
  let collapsePoint: number | null = null;
  let firstMistake: string | null = null;
  let lastInterventionPoint: number | null = null;
  let prevScore = timeline[0]?.state.trustScore ?? 0;
  for (let i = 1; i < timeline.length; i++) {
    const e = timeline[i];
    const score = e.state.trustScore;
    if (score < 20 && prevScore >= 20) collapsePoint = i;
    if (e.action && (e.action === "trust_collapse" || e.action === "debt_collection")) {
      if (collapsePoint == null) collapsePoint = i;
      lastInterventionPoint = i - 1;
    }
    if (score < prevScore - 15 && firstMistake == null) {
      firstMistake = `Step ${i}: sharp drop from ${prevScore.toFixed(0)} to ${score.toFixed(0)} (${e.action ?? "signal"}).`;
    }
    prevScore = score;
  }
  if (lastInterventionPoint == null && timeline.length > 0) lastInterventionPoint = timeline.length - 1;
  const narrative = [
    collapsePoint != null ? `Collapse detected at step ${collapsePoint}.` : "No full collapse in timeline.",
    firstMistake ?? "No single large drop identified.",
    lastInterventionPoint != null ? `Last intervention point: step ${lastInterventionPoint}.` : "N/A",
  ].join(" ");
  return {
    collapsePoint,
    firstMistake,
    lastInterventionPoint,
    narrative,
  };
}
