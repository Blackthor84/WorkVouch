/**
 * Enterprise intelligence pipeline. Server-side only.
 * Run after: verification completion, reference submission, dispute resolution,
 * employment record update, coworker link creation.
 * All engines fail gracefully; neutral scores if insufficient data; never block flow.
 * When simulationContext is provided, all persisted rows are tagged with simulation_session_id.
 */

import type { SimulationContext } from "@/lib/simulation-lab";
import { computeAndPersistRiskModel } from "@/lib/risk-model";
import { computeAndPersistNetworkDensity } from "@/lib/network-density";
import { computeAndPersistTeamFit } from "@/lib/team-fit-engine";
import { computeAndPersistHiringConfidence } from "@/lib/hiring-confidence";

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
 * When simulationContext is provided, validates session and tags all outputs.
 */
export async function runCandidateIntelligence(
  candidateId: string,
  simulationContext?: SimulationContext | null
): Promise<void> {
  try {
    await Promise.all([
      computeAndPersistRiskModel(candidateId, null, simulationContext).catch((e) => {
        safeLogError("risk-model", e);
      }),
      computeAndPersistNetworkDensity(candidateId, simulationContext).catch((e) => {
        safeLogError("network-density", e);
      }),
    ]);
  } catch (e) {
    safeLogError("runCandidateIntelligence", e);
  }
}

/**
 * Run employer-candidate engines (team fit, hiring confidence). Requires employerId.
 * When simulationContext is provided, tags all outputs with simulation_session_id.
 */
export async function runEmployerCandidateIntelligence(
  candidateId: string,
  employerId: string,
  simulationContext?: SimulationContext | null
): Promise<void> {
  try {
    await computeAndPersistTeamFit(candidateId, employerId, simulationContext).catch((e) => {
      safeLogError("team-fit-engine", e);
    });
    await computeAndPersistHiringConfidence(candidateId, employerId, simulationContext).catch((e) => {
      safeLogError("hiring-confidence", e);
    });
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
  employerId?: string | null,
  simulationContext?: SimulationContext | null
): Promise<void> {
  await runCandidateIntelligence(candidateId, simulationContext);
  if (employerId) {
    await runEmployerCandidateIntelligence(candidateId, employerId, simulationContext);
  }
}
