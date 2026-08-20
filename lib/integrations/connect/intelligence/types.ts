import type { AtsProviderId } from "../../types/common";
import { ATS_EVENT_TYPES } from "../../core/events/ats-event-types";
import { WORKFLOW_EVENT_TYPES } from "../orchestration/workflow-event-types";

/** Hiring funnel stages measured from Connect event store (no duplicate events). */
export type HiringFunnelStage =
  | "candidate_imported"
  | "invitation_sent"
  | "invitation_accepted"
  | "verification_started"
  | "verification_completed"
  | "references_requested"
  | "references_completed"
  | "trust_updated"
  | "workflow_completed";

export const HIRING_FUNNEL_STAGES: HiringFunnelStage[] = [
  "candidate_imported",
  "invitation_sent",
  "invitation_accepted",
  "verification_started",
  "verification_completed",
  "references_requested",
  "references_completed",
  "trust_updated",
  "workflow_completed",
];

/** Maps funnel stages to event store event types (immutable source of truth). */
export const STAGE_EVENT_TYPES: Record<HiringFunnelStage, string[]> = {
  candidate_imported: [ATS_EVENT_TYPES.CandidateCreated, ATS_EVENT_TYPES.ApplicationCreated],
  invitation_sent: [WORKFLOW_EVENT_TYPES.InvitationSent],
  invitation_accepted: [WORKFLOW_EVENT_TYPES.InvitationAccepted],
  verification_started: [WORKFLOW_EVENT_TYPES.VerificationStarted, WORKFLOW_EVENT_TYPES.VerificationRequested],
  verification_completed: [WORKFLOW_EVENT_TYPES.VerificationRequested],
  references_requested: [WORKFLOW_EVENT_TYPES.ReferenceRequested],
  references_completed: [WORKFLOW_EVENT_TYPES.ReferenceReceived],
  trust_updated: [WORKFLOW_EVENT_TYPES.WorkflowCompleted],
  workflow_completed: [WORKFLOW_EVENT_TYPES.WorkflowCompleted],
};

export type MetricsPeriod = "day" | "week" | "month" | "7d" | "30d" | "90d" | "ytd" | "lifetime";

export type AggregationLevel =
  | "candidate"
  | "job"
  | "department"
  | "employer"
  | "provider"
  | "connection";

export interface StageTiming {
  from: HiringFunnelStage;
  to: HiringFunnelStage;
  durationMs: number;
  candidateId: string;
}

export interface CandidateFunnelTimeline {
  candidateId: string;
  jobId?: string;
  department?: string;
  connectionId?: string;
  provider?: AtsProviderId;
  stages: Partial<Record<HiringFunnelStage, string>>;
  stageTimings: StageTiming[];
  totalProcessingMs?: number;
  automated: boolean;
}

export interface CoreHiringMetrics {
  /** Time from import → invitation sent (avg ms). */
  importToInvitationMs: number;
  invitationAcceptanceRate: number;
  invitationDeclineRate: number;
  verificationCompletionRate: number;
  averageVerificationMs: number;
  referenceCompletionRate: number;
  averageReferenceResponseMs: number;
  atsEventToWorkflowCompletionMs: number;
  automationSuccessRate: number;
  workflowFailureRate: number;
  averageProcessingMs: number;
}

export interface AdvancedHiringMetrics {
  importSuccessRate: number;
  automationTriggerRate: number;
  replayRate: number;
  manualOverrideRate: number;
  averageCandidateProcessingMs: number;
  averageEmployerSetupMs: number;
  syncSuccessRate: number;
  recoverySuccessRate: number;
  averageQueueWaitMs: number;
}

export interface RoiHiringMetrics {
  hoursSaved: number;
  manualTasksEliminated: number;
  averageTimeSavedPerCandidateMs: number;
  candidatesProcessedAutomatically: number;
  manualFollowUpReductionRate: number;
  automationCoverageRate: number;
}

export interface HiringMetricsBundle {
  core: CoreHiringMetrics;
  advanced: AdvancedHiringMetrics;
  roi: RoiHiringMetrics;
  funnelCounts: Partial<Record<HiringFunnelStage, number>>;
  sampleSize: number;
  calculatedAt: string;
}

export interface HiringMetricsSnapshotRecord {
  id: string;
  employerAccountId: string;
  connectionId?: string;
  provider?: AtsProviderId;
  aggregationLevel: AggregationLevel;
  aggregationKey: string;
  period: MetricsPeriod;
  periodStart: string;
  periodEnd: string;
  metrics: HiringMetricsBundle;
  createdAt: string;
}

export interface MetricsQueryInput {
  employerAccountId: string;
  connectionId?: string;
  provider?: AtsProviderId;
  period?: MetricsPeriod;
  aggregationLevel?: AggregationLevel;
  aggregationKey?: string;
  fromOccurredAt?: string;
  toOccurredAt?: string;
}

export interface TrendComparison {
  current: HiringMetricsBundle;
  previous: HiringMetricsBundle;
  period: MetricsPeriod;
  delta: Partial<Record<keyof CoreHiringMetrics, number>>;
}

/** ROI constants — conservative estimates for Customer Success reporting. */
export const ROI_CONSTANTS = {
  MANUAL_INVITE_MINUTES: 15,
  MANUAL_VERIFICATION_FOLLOWUP_MINUTES: 20,
  MANUAL_REFERENCE_CHASE_MINUTES: 25,
  MANUAL_SYNC_MINUTES: 30,
  MS_PER_MINUTE: 60_000,
} as const;

export function eventTypeToStage(eventType: string, payload?: Record<string, unknown>): HiringFunnelStage | undefined {
  if (eventType === WORKFLOW_EVENT_TYPES.WorkflowCancelled) return undefined;

  if (eventType === WORKFLOW_EVENT_TYPES.WorkflowCompleted) {
    const action = (payload as { action?: string })?.action;
    if (action === "refresh_trust") return "trust_updated";
    return "workflow_completed";
  }

  for (const stage of HIRING_FUNNEL_STAGES) {
    if (stage === "trust_updated" || stage === "workflow_completed") continue;
    if (STAGE_EVENT_TYPES[stage].includes(eventType)) {
      return stage;
    }
  }
  return undefined;
}

export function periodToDateRange(period: MetricsPeriod, now = new Date()): { start: string; end: string } {
  const end = now.toISOString();
  const d = new Date(now);

  switch (period) {
    case "day":
      d.setUTCDate(d.getUTCDate() - 1);
      break;
    case "week":
      d.setUTCDate(d.getUTCDate() - 7);
      break;
    case "month":
      d.setUTCMonth(d.getUTCMonth() - 1);
      break;
    case "7d":
      d.setUTCDate(d.getUTCDate() - 7);
      break;
    case "30d":
      d.setUTCDate(d.getUTCDate() - 30);
      break;
    case "90d":
      d.setUTCDate(d.getUTCDate() - 90);
      break;
    case "ytd":
      d.setUTCFullYear(d.getUTCFullYear(), 0, 1);
      d.setUTCHours(0, 0, 0, 0);
      break;
    case "lifetime":
      return { start: new Date(0).toISOString(), end };
  }

  return { start: d.toISOString(), end };
}

export function emptyMetricsBundle(): HiringMetricsBundle {
  return {
    core: {
      importToInvitationMs: 0,
      invitationAcceptanceRate: 0,
      invitationDeclineRate: 0,
      verificationCompletionRate: 0,
      averageVerificationMs: 0,
      referenceCompletionRate: 0,
      averageReferenceResponseMs: 0,
      atsEventToWorkflowCompletionMs: 0,
      automationSuccessRate: 0,
      workflowFailureRate: 0,
      averageProcessingMs: 0,
    },
    advanced: {
      importSuccessRate: 0,
      automationTriggerRate: 0,
      replayRate: 0,
      manualOverrideRate: 0,
      averageCandidateProcessingMs: 0,
      averageEmployerSetupMs: 0,
      syncSuccessRate: 0,
      recoverySuccessRate: 0,
      averageQueueWaitMs: 0,
    },
    roi: {
      hoursSaved: 0,
      manualTasksEliminated: 0,
      averageTimeSavedPerCandidateMs: 0,
      candidatesProcessedAutomatically: 0,
      manualFollowUpReductionRate: 0,
      automationCoverageRate: 0,
    },
    funnelCounts: {},
    sampleSize: 0,
    calculatedAt: new Date().toISOString(),
  };
}
