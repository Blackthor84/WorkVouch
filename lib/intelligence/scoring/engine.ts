/**
 * WorkVouch Intelligence Engine — single entry point.
 * All production and sandbox scoring must use this.
 * See docs/workvouch-intelligence-v1.md.
 */

import { calculateV1 } from "./v1";
import type { ProfileInput } from "./types";

import { calculateV1 } from "./v1";
import type { ProfileInput } from "./types";

export type IntelligenceVersion = "v1";
export { calculateV1 } from "./v1";
export type { ProfileInput } from "./types";

/**
 * Calculate profile strength (employment confidence score 0–100).
 * Versioned; only v1 is canonical. No duplicate logic elsewhere.
 */
export function calculateProfileStrength(
  version: IntelligenceVersion,
  input: ProfileInput
): number {
  switch (version) {
    case "v1":
      return calculateV1(input);
    default:
      return calculateV1(input);
  }
}
