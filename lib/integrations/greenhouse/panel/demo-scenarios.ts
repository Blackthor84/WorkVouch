import type { GreenhousePanelPayload } from "./types";
import { buildDemoPanelPayload } from "./demo-payload";

export type DemoPanelScenario = "high" | "moderate" | "warning" | "not_linked";

/** Marketplace demo scenarios for Greenhouse reviewer sandbox. */
export function buildDemoScenarioPayload(
  externalCandidateId: string,
  scenario: DemoPanelScenario = "high"
): GreenhousePanelPayload {
  const base = buildDemoPanelPayload(externalCandidateId);

  switch (scenario) {
    case "moderate":
      return {
        ...base,
        candidateName: "Alex Rivera",
        currentStage: "Phone Screen",
        trustScore: 72,
        trustBand: "Strong",
        hiringConfidence: {
          ...base.hiringConfidence,
          confidenceScore: 67,
          confidenceLevel: "moderate",
          confidenceLevelLabel: "Moderate Confidence",
          starRating: 3,
          recommendation: "ready_to_interview",
          recommendationLabel: "Ready to Interview",
        },
        referenceSummary: {
          ...base.referenceSummary,
          completed: 2,
          pending: 2,
          managers: 1,
          coworkers: 1,
          overallConsensus: "moderate",
          completionPct: 50,
        },
        syncStatus: { ...base.syncStatus, status: "synced" },
      };
    case "warning":
      return {
        ...base,
        candidateName: "Sam Okonkwo",
        currentStage: "Application Review",
        trustScore: 41,
        trustBand: "Moderate",
        verificationStatus: "in_progress",
        employmentVerified: false,
        managerReferences: 0,
        coworkerReferences: 1,
        referenceCompletionPct: 25,
        linkStatus: "stale",
        hiringConfidence: {
          ...base.hiringConfidence,
          confidenceScore: 41,
          confidenceLevel: "needs_review",
          confidenceLevelLabel: "Needs Review",
          starRating: 2,
          recommendation: "needs_additional_verification",
          recommendationLabel: "Needs Additional Verification",
        },
        syncStatus: {
          lastSyncedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          status: "stale",
          connectionHealthy: false,
        },
        actions: { ...base.actions, canRetrySync: true },
      };
    case "not_linked":
      return {
        ...base,
        candidateName: "Taylor Brooks",
        currentStage: "New Applicant",
        linkStatus: "not_linked",
        trustScore: null,
        trustBand: null,
        verificationStatus: "not_started",
        employmentVerified: false,
        managerReferences: 0,
        coworkerReferences: 0,
        referenceCompletionPct: 0,
        employmentTimeline: [],
        referenceSummary: {
          completed: 0,
          pending: 0,
          managers: 0,
          coworkers: 0,
          wouldRehire: "unknown",
          overallConsensus: "unknown",
          completionPct: 0,
        },
        hiringConfidence: {
          ...base.hiringConfidence,
          confidenceScore: 18,
          confidenceLevel: "low",
          confidenceLevelLabel: "Low Confidence",
          starRating: 1,
          recommendation: "requires_manual_review",
          recommendationLabel: "Requires Manual Review",
          trustScore: null,
        },
      };
    case "high":
    default:
      return base;
  }
}
