/**
 * WorkVouch Intelligence Engine — single entry point.
 * All production and sandbox scoring must use this.
 * See docs/workvouch-intelligence-v1.md.
 */

import { calculateV1Breakdown } from "./v1";
import { applyVerticalModifiers } from "./verticalModifiers";
import type { ProfileInput } from "./types";

export type IntelligenceVersion = "v1";
export { calculateV1, calculateV1Breakdown } from "./v1";
export type { ProfileInput } from "./types";
export type { V1Breakdown } from "./v1";
export { applyVerticalModifiers, isVerticalEnabled } from "./verticalModifiers";
export type { VerticalKey } from "./verticalModifiers";

export interface CalculateProfileStrengthOptions {
  /** Vertical key (default, education, construction). Modifiers applied after V1 breakdown. */
  vertical?: string | null;
}

/**
 * Calculate profile strength (employment confidence score 0–100).
 * Versioned; only v1 is canonical. Vertical modifiers applied AFTER V1 breakdown; no scoring duplication.
 */
export function calculateProfileStrength(
  version: IntelligenceVersion,
  input: ProfileInput,
  options?: CalculateProfileStrengthOptions
): number {
  const breakdown = calculateV1Breakdown(input);
  const withVertical = applyVerticalModifiers(options?.vertical, breakdown);
  return withVertical.totalScore;
}
