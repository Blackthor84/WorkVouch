import { calculateTrustScore } from "./calculateTrustScore";
import type { TrustScoreData } from "./types";

/**
 * Sensitivity: "What if we ignored this reference?"
 * Returns trust score with that reference excluded. In-memory only.
 */
export function recomputeWithoutReference(
  base: TrustScoreData,
  referenceId: string
): number {
  const refs = base.references ?? base.peerReferences ?? [];
  const filtered = refs.filter((r) => r.id !== referenceId);
  return calculateTrustScore({
    ...base,
    peerReferences: filtered,
  });
}
