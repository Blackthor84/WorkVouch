/**
 * Employee-safe behavioral summary. Human-friendly only; never exposes raw scores.
 * Use only when feature flag behavioral_intelligence_enterprise is enabled and
 * the viewer is the candidate viewing their own profile.
 */

import type { BehavioralVector } from "./getBehavioralVector";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number(n))));
}

/**
 * Build a single human-friendly sentence from aggregated behavioral vector.
 * Deterministic; no random logic. Never includes numeric scores.
 */
export function buildBehavioralSummary(vector: BehavioralVector): string {
  const r = clamp(vector.avg_reliability);
  const s = clamp(vector.avg_structure);
  const c = clamp(vector.avg_communication);
  const l = clamp(vector.avg_leadership);
  const i = clamp(vector.avg_initiative);
  const t = clamp(vector.tone_stability);

  const parts: string[] = [];

  if (r >= 70) parts.push("reliable");
  if (s >= 70) parts.push("effective in structured environments");
  if (c >= 70) parts.push("clear communicator");
  if (l >= 70) parts.push("strong collaborator");
  if (i >= 70) parts.push("takes initiative");
  if (t >= 70) parts.push("consistent in how peers describe you");

  if (parts.length === 0) return "Peer feedback is still being gathered.";
  if (parts.length === 1) return `Peers frequently describe you as ${parts[0]}.`;
  if (parts.length === 2) return `Peers frequently describe you as ${parts[0]} and ${parts[1]}.`;
  return `Peers frequently describe you as ${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}.`;
}
