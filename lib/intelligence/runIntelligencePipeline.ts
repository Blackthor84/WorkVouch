/**
 * Enterprise intelligence pipeline. Server-side only.
 * Run after: verification completion, reference submission, dispute resolution,
 * employment record update, coworker link creation.
 * All engines fail gracefully; neutral scores if insufficient data; never block flow.
 * Logs model runs and engine failures (server-side only).
 */

import { computeAndPersistRiskModel } from "@/lib/risk-model";
import { computeAndPersistNetworkDensity } from "@/lib/network-density";
import { computeAndPersistTeamFit } from "@/lib/team-fit-engine";
import { computeAndPersistHiringConfidence } from "@/lib/hiring-confidence";

function safeLog(context: string, message: string, meta?: Record<string, unknown>): void {
  try {
    if (typeof console !== "undefined" && console.info) {
      console.info(`[intelligence:${context}]`, message, meta ?? "");
    }
  } catch {
    // no-op
  }
}

function safeLogError(context: string, err: unknown): void {
  try {
    if (typeof console !== "undefined" && console.error) {
      console.error(`[intelligence:${context}]`, err);
    }
  } catch {
    // no-op
  }
}

/**
 * Run all candidate-level engines (risk, network density). No employer context required.
 * Call after verification completion, reference submission, dispute resolution, employment record update.
 */
export async function runCandidateIntelligence(candidateId: string): Promise<void> {
  try {
    safeLog("runCandidateIntelligence", "start", { candidateId });
    await Promise.all([
      computeAndPersistRiskModel(candidateId, null).catch((e) => {
        safeLogError("risk-model", e);
      }),
      computeAndPersistNetworkDensity(candidateId).catch((e) => {
        safeLogError("network-density", e);
      }),
    ]);
    safeLog("runCandidateIntelligence", "complete", { candidateId });
  } catch (e) {
    safeLogError("runCandidateIntelligence", e);
  }
}

/**
 * Run employer-candidate engines (team fit, hiring confidence). Requires employerId.
 * Call when employer views candidate or after verification in employer context.
 */
export async function runEmployerCandidateIntelligence(
  candidateId: string,
  employerId: string
): Promise<void> {
  try {
    safeLog("runEmployerCandidateIntelligence", "start", { candidateId, employerId });
    await computeAndPersistTeamFit(candidateId, employerId).catch((e) => {
      safeLogError("team-fit-engine", e);
    });
    await computeAndPersistHiringConfidence(candidateId, employerId).catch((e) => {
      safeLogError("hiring-confidence", e);
    });
    safeLog("runEmployerCandidateIntelligence", "complete", { candidateId, employerId });
  } catch (e) {
    safeLogError("runEmployerCandidateIntelligence", e);
  }
}

/**
 * Full pipeline: candidate-level + employer-candidate (if employerId provided).
 * Single entry point for triggers.
 */
export async function runIntelligencePipeline(
  candidateId: string,
  employerId?: string | null
): Promise<void> {
  await runCandidateIntelligence(candidateId);
  if (employerId) {
    await runEmployerCandidateIntelligence(candidateId, employerId);
  }
}
