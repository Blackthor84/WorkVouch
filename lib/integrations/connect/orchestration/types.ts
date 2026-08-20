import type { AtsEventType } from "../../core/events/ats-event-types";
import type { AtsApplication } from "../../core/models/Application";
import type { AtsCandidate } from "../../core/models/Candidate";

/** Candidate lifecycle states managed by the orchestration engine. */
export type LifecycleState =
  | "imported"
  | "pending"
  | "eligible"
  | "invited"
  | "account_created"
  | "employment_verification"
  | "reference_collection"
  | "reference_complete"
  | "verification_complete"
  | "trust_updated"
  | "archived"
  | "cancelled";

/** Workflow actions the engine can execute. */
export type WorkflowActionType =
  | "invite_candidate"
  | "send_reminder"
  | "cancel_invitation"
  | "archive"
  | "create_verification"
  | "request_references"
  | "refresh_trust"
  | "queue_ai_summary"
  | "wait"
  | "ignore";

/** Decision outcomes from the rules engine. */
export type LifecycleDecision =
  | "invite"
  | "wait"
  | "request_references"
  | "pause"
  | "archive"
  | "ignore";

/** Auto-invite trigger configuration. */
export type AutoInviteTrigger =
  | "application"
  | "phone_screen"
  | "final_interview"
  | "offer"
  | "hire"
  | "manual";

export type FilterMode = "all" | "selected" | "excluded";

/** Employer automation preferences (stored on connection metadata). */
export interface AutomationPreferences {
  autoInviteEnabled: boolean;
  autoInviteTrigger: AutoInviteTrigger;
  autoInviteDelayHours: number;
  jobFilterMode: FilterMode;
  jobFilterIds: string[];
  departmentFilterMode: FilterMode;
  departmentFilterIds: string[];
  locationFilterMode: FilterMode;
  locationFilter: string[];
  employmentTypeFilterMode: FilterMode;
  employmentTypeFilter: string[];
}

export const DEFAULT_AUTOMATION_PREFERENCES: AutomationPreferences = {
  autoInviteEnabled: true,
  autoInviteTrigger: "final_interview",
  autoInviteDelayHours: 0,
  jobFilterMode: "all",
  jobFilterIds: [],
  departmentFilterMode: "all",
  departmentFilterIds: [],
  locationFilterMode: "all",
  locationFilter: [],
  employmentTypeFilterMode: "all",
  employmentTypeFilter: [],
};

export interface AutomationRuleMatch {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  reason: string;
}

export interface RuleEvaluationContext {
  universalEvent: AtsEventType;
  providerEvent: string;
  connectionId: string;
  employerAccountId: string;
  candidate?: AtsCandidate;
  application?: AtsApplication;
  stageName?: string;
  preferences: AutomationPreferences;
  currentState?: LifecycleState;
  alreadyInvited?: boolean;
}

export interface RuleEvaluationResult {
  matches: AutomationRuleMatch[];
  eligible: boolean;
  primaryRuleId?: string;
}

export interface DecisionResult {
  decision: LifecycleDecision;
  action: WorkflowActionType;
  reason: string;
  ruleId?: string;
  delayMs?: number;
}

export interface WorkflowExecutionResult {
  action: WorkflowActionType;
  success: boolean;
  lifecycleState: LifecycleState;
  businessEvent?: string;
  invitationId?: string;
  durationMs: number;
  error?: string;
}

export interface LifecycleOrchestrationResult {
  correlationId: string;
  connectionId: string;
  employerAccountId: string;
  universalEvent: AtsEventType;
  evaluation: RuleEvaluationResult;
  decision: DecisionResult;
  workflow: WorkflowExecutionResult;
  previousState: LifecycleState;
  nextState: LifecycleState;
  durationMs: number;
}

export type InvitationQueueStatus =
  | "pending"
  | "scheduled"
  | "sent"
  | "failed"
  | "retry"
  | "cancelled"
  | "expired";

export interface InvitationQueueItem {
  id: string;
  connectionId: string;
  employerAccountId: string;
  externalCandidateId: string;
  candidateEmail: string;
  candidateName?: string;
  jobExternalId?: string;
  status: InvitationQueueStatus;
  scheduledAt?: string;
  sentAt?: string;
  retryCount: number;
  maxRetries: number;
  correlationId: string;
  ruleId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LifecycleStateRecord {
  id: string;
  connectionId: string;
  employerAccountId: string;
  externalCandidateId: string;
  state: LifecycleState;
  previousState?: LifecycleState;
  lastEventType?: string;
  lastDecision?: LifecycleDecision;
  metadata: Record<string, unknown>;
  updatedAt: string;
  createdAt: string;
}

export interface WorkflowObservabilityRecord {
  id: string;
  correlationId: string;
  connectionId: string;
  employerAccountId: string;
  universalEvent: string;
  ruleMatched?: string;
  decision: LifecycleDecision;
  action: WorkflowActionType;
  workflowResult: "success" | "failure" | "skipped";
  durationMs: number;
  metadata: Record<string, unknown>;
  recordedAt: string;
}
