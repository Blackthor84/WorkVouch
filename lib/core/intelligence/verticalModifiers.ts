/**
 * Centralized vertical modifiers for the intelligence engine.
 * Applied AFTER V1 breakdown; no scoring math duplication.
 * One scoring engine (v1) + optional vertical adjustment.
 */

import type { V1Breakdown } from "./v1";

export type VerticalKey = "default" | "education" | "construction";

const MIN_SCORE = 0;
const MAX_SCORE = 100;

/**
 * Per-vertical score modifier (e.g. 1.0 = no change, 1.05 = +5%).
 * Applied to totalScore after V1; clamped to [0, 100].
 */
const VERTICAL_SCORE_MODIFIERS: Record<VerticalKey, number> = {
  default: 1.0,
  education: 1.0,
  construction: 1.0,
};

/**
 * Apply vertical modifier to V1 breakdown.
 * Same scoring foundation; optional vertical tweak on totalScore only.
 */
export function applyVerticalModifiers(
  vertical: string | null | undefined,
  breakdown: V1Breakdown
): V1Breakdown {
  const key = normalizeVerticalKey(vertical);
  const mod = VERTICAL_SCORE_MODIFIERS[key] ?? 1.0;
  const adjustedTotal = Math.round(
    Math.max(MIN_SCORE, Math.min(MAX_SCORE, breakdown.totalScore * mod))
  );
  return {
    ...breakdown,
    totalScore: adjustedTotal,
  };
}

function normalizeVerticalKey(
  vertical: string | null | undefined
): VerticalKey {
  if (vertical === "education" || vertical === "construction") return vertical;
  return "default";
}

/**
 * Check if a vertical is enabled for UI/API (platform_verticals.enabled or env).
 */
export function isVerticalEnabled(
  verticalName: string,
  dbEnabled: boolean
): boolean {
  if (dbEnabled) return true;
  const envKey = `ENABLE_VERTICAL_${verticalName.toUpperCase()}` as
    | "ENABLE_VERTICAL_EDUCATION"
    | "ENABLE_VERTICAL_CONSTRUCTION";
  return process.env[envKey] === "true";
}
