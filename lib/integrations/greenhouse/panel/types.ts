import type { LifecycleState } from "../../connect/orchestration/types";
import type { HiringConfidenceResult } from "@/lib/trust/confidence/types";

export type PanelLinkStatus = "synced" | "stale" | "error" | "not_linked" | "pending";

export type PanelVerificationStatus =
  | "verified"
  | "in_progress"
  | "not_started"
  | "failed"
  | "unknown";

export interface TrustScoreFactor {
  id: string;
  label: string;
  weight: number;
  contribution: number;
  confidence: number;
  status: "positive" | "neutral" | "negative";
}

export interface PanelEmploymentEntry {
  id: string;
  employer: string;
  role: string;
  startDate: string;
  endDate: string | null;
  verificationStatus: PanelVerificationStatus;
  managerVerified: boolean;
  coworkerVerified: boolean;
  timelineConfidence: number;
}

export interface PanelReferenceSummary {
  completed: number;
  pending: number;
  managers: number;
  coworkers: number;
  wouldRehire: "yes" | "mixed" | "no" | "unknown";
  overallConsensus: "strong" | "moderate" | "weak" | "unknown";
  completionPct: number;
}

export type PanelWorkflowStepId =
  | "imported"
  | "invited"
  | "account_created"
  | "verification_started"
  | "references_pending"
  | "references_complete"
  | "trust_updated"
  | "complete";

export interface PanelWorkflowStep {
  id: PanelWorkflowStepId;
  label: string;
  status: "complete" | "active" | "pending" | "skipped";
  completedAt?: string;
}

export interface PanelHiringIntelligencePreview {
  averageVerificationTimeHours: number | null;
  completionRatePct: number | null;
  averageReferenceTimeHours: number | null;
  automationEnabled: boolean;
  processingTimeMs: number | null;
}

export interface PanelActions {
  canRefresh: boolean;
  canReplayWorkflow: boolean;
  canViewTimeline: boolean;
  canViewAudit: boolean;
  canOpenFullReport: boolean;
  canRetrySync: boolean;
}

export interface PanelSyncStatus {
  lastSyncedAt: string | null;
  status: PanelLinkStatus;
  connectionHealthy: boolean;
}

export interface GreenhousePanelPayload {
  provider: "greenhouse";
  externalCandidateId: string;
  connectionId: string | null;
  employerAccountId: string | null;
  linkStatus: PanelLinkStatus;
  candidateName: string;
  currentStage: string;
  trustScore: number | null;
  trustBand: string | null;
  hiringConfidence: HiringConfidenceResult;
  verificationStatus: PanelVerificationStatus;
  employmentVerified: boolean;
  managerReferences: number;
  coworkerReferences: number;
  referenceCompletionPct: number;
  workflowStatus: PanelWorkflowStep[];
  lastUpdated: string;
  explainability: TrustScoreFactor[];
  employmentTimeline: PanelEmploymentEntry[];
  referenceSummary: PanelReferenceSummary;
  hiringIntelligence: PanelHiringIntelligencePreview;
  syncStatus: PanelSyncStatus;
  profileUrl: string | null;
  fullReportUrl: string | null;
  timelineUrl: string | null;
  auditUrl: string | null;
  actions: PanelActions;
  aiSummary?: string;
  aiSummaryGeneratedAt?: string;
}

export interface PanelAuthContext {
  connectionId: string;
  employerAccountId: string;
  externalCandidateId: string;
  issuedAt: number;
  expiresAt: number;
}

export interface PanelBuildInput {
  connectionId: string;
  employerAccountId: string;
  externalCandidateId: string;
  demo?: boolean;
  demoScenario?: string;
}

export const WORKFLOW_STEP_DEFINITIONS: Array<{ id: PanelWorkflowStepId; label: string }> = [
  { id: "imported", label: "Imported" },
  { id: "invited", label: "Invited" },
  { id: "account_created", label: "Account Created" },
  { id: "verification_started", label: "Verification Started" },
  { id: "references_pending", label: "References Pending" },
  { id: "references_complete", label: "References Complete" },
  { id: "trust_updated", label: "Trust Updated" },
  { id: "complete", label: "Complete" },
];

export function mapLifecycleToWorkflowSteps(
  lifecycleState: LifecycleState | null,
  timestamps?: Partial<Record<PanelWorkflowStepId, string>>
): PanelWorkflowStep[] {
  const order = WORKFLOW_STEP_DEFINITIONS.map((s) => s.id);
  const stateIndex = lifecycleState ? lifecycleIndex(lifecycleState) : -1;

  return WORKFLOW_STEP_DEFINITIONS.map((step, index) => {
    let status: PanelWorkflowStep["status"] = "pending";
    if (stateIndex >= order.length - 1 && index <= stateIndex) status = "complete";
    else if (index < stateIndex) status = "complete";
    else if (index === stateIndex) status = "active";
    else if (lifecycleState === "cancelled" || lifecycleState === "archived") {
      status = index <= stateIndex ? "complete" : "skipped";
    }

    return {
      id: step.id,
      label: step.label,
      status,
      completedAt: timestamps?.[step.id],
    };
  });
}

function lifecycleIndex(state: LifecycleState): number {
  const map: Record<LifecycleState, number> = {
    imported: 0,
    pending: 0,
    eligible: 0,
    invited: 1,
    account_created: 2,
    employment_verification: 3,
    reference_collection: 4,
    reference_complete: 5,
    verification_complete: 5,
    trust_updated: 6,
    archived: 7,
    cancelled: -1,
  };
  return map[state] ?? 0;
}
