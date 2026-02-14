/**
 * Core trust score. Single execution path; deterministic and reproducible.
 * Re-exports from lib/trustScore so all callers use one source. Never differs by environment.
 */

export {
  calculateCoreTrustScore,
  recalculateTrustScore,
  getTrustScoreComponents,
} from "@/lib/trustScore";
export type { TrustScoreComponents } from "@/lib/trustScore";
