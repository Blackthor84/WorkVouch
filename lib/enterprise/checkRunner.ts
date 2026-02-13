/**
 * Batched reference-check runner: rate-limits by plan via checkOrgLimits, logs execution time.
 * Use for real and simulated traffic. Caller performs the actual check for each allowed id.
 */

import { checkOrgLimits } from "./checkOrgLimits";

export interface BatchCheckResult {
  /** Candidate/entity ids that passed the limit check (caller should run the actual check for these). */
  allowedIds: string[];
  /** First id that was blocked (if any). */
  blockedAtId: string | null;
  blocked: boolean;
  reason?: string;
  executionTimeMs: number;
}

/**
 * For each id, call checkOrgLimits(organizationId, "reference_lookup").
 * Collect ids that are allowed; stop on first block. Log execution time.
 * Caller is responsible for performing the actual reference lookup for allowedIds.
 */
export async function runBatchReferenceChecks(
  organizationId: string,
  candidateIds: string[]
): Promise<BatchCheckResult> {
  const start = Date.now();
  const allowedIds: string[] = [];
  let blockedAtId: string | null = null;
  let reason: string | undefined;

  for (const id of candidateIds) {
    const result = await checkOrgLimits(organizationId, "reference_lookup");
    if (!result.allowed) {
      blockedAtId = id;
      reason = result.reason ?? result.error;
      break;
    }
    allowedIds.push(id);
  }

  const executionTimeMs = Date.now() - start;
  return {
    allowedIds,
    blockedAtId,
    blocked: blockedAtId != null,
    reason,
    executionTimeMs,
  };
}
