import { randomUUID } from "crypto";
import { nowIso } from "../../utils/correlation";
import type { ConnectEventStore } from "../event-store/connect-event-store";
import type { CandidateMapRepository } from "../persistence/repositories/candidate-map-repository";
import type { InvitationQueueRepository } from "../persistence/repositories/invitation-queue-repository";
import type { LifecycleStateRepository } from "../persistence/repositories/lifecycle-state-repository";
import { CONNECT_PLATFORM_VERSION } from "../version";
import { WORKFLOW_EVENT_TYPES } from "./workflow-event-types";
import type {
  LifecycleState,
  WorkflowActionType,
  WorkflowExecutionResult,
} from "./types";
import { decisionToLifecycleTransition } from "./decision-engine";

export interface WorkflowContext {
  connectionId: string;
  employerAccountId: string;
  correlationId: string;
  externalCandidateId: string;
  candidateEmail?: string;
  candidateName?: string;
  jobExternalId?: string;
  action: WorkflowActionType;
  decision: import("./types").LifecycleDecision;
  ruleId?: string;
  delayMs?: number;
  currentState?: LifecycleState;
  provider: import("../../types/common").AtsProviderId;
}

export interface WorkflowEngineDeps {
  invitationQueue: InvitationQueueRepository;
  lifecycleState: LifecycleStateRepository;
  candidateMap?: CandidateMapRepository;
  eventStore?: ConnectEventStore;
}

/** Executes workflow actions and emits business events. */
export class WorkflowEngine {
  constructor(private readonly deps: WorkflowEngineDeps) {}

  async execute(context: WorkflowContext): Promise<WorkflowExecutionResult> {
    const started = Date.now();
    const previousState = context.currentState ?? "imported";

    try {
      switch (context.action) {
        case "invite_candidate":
          return await this.inviteCandidate(context, previousState, started);
        case "create_verification":
          return await this.createVerification(context, previousState, started);
        case "request_references":
          return await this.requestReferences(context, previousState, started);
        case "archive":
          return await this.archive(context, started);
        case "send_reminder":
          return await this.sendReminder(context, previousState, started);
        case "cancel_invitation":
          return await this.cancelInvitation(context, previousState, started);
        case "refresh_trust":
          return await this.emitBusinessEvent(context, previousState, WORKFLOW_EVENT_TYPES.WorkflowCompleted, "refresh_trust", started);
        case "queue_ai_summary":
          return {
            action: "queue_ai_summary",
            success: true,
            lifecycleState: previousState,
            durationMs: Date.now() - started,
          };
        case "wait":
        case "ignore":
        default:
          return {
            action: context.action,
            success: true,
            lifecycleState: decisionToLifecycleTransition(context.decision, previousState),
            durationMs: Date.now() - started,
          };
      }
    } catch (error) {
      return {
        action: context.action,
        success: false,
        lifecycleState: previousState,
        durationMs: Date.now() - started,
        error: error instanceof Error ? error.message : "Workflow failed",
      };
    }
  }

  private async inviteCandidate(
    context: WorkflowContext,
    previousState: LifecycleState,
    started: number
  ): Promise<WorkflowExecutionResult> {
    if (!context.candidateEmail) {
      return {
        action: "invite_candidate",
        success: false,
        lifecycleState: previousState,
        durationMs: Date.now() - started,
        error: "Candidate email required for invitation",
      };
    }

    const scheduledAt =
      context.delayMs && context.delayMs > 0
        ? new Date(Date.now() + context.delayMs).toISOString()
        : undefined;

    const invitation = await this.deps.invitationQueue.enqueue({
      connectionId: context.connectionId,
      employerAccountId: context.employerAccountId,
      externalCandidateId: context.externalCandidateId,
      candidateEmail: context.candidateEmail,
      candidateName: context.candidateName,
      jobExternalId: context.jobExternalId,
      status: scheduledAt ? "scheduled" : "pending",
      scheduledAt,
      correlationId: context.correlationId,
      ruleId: context.ruleId,
      metadata: { source: "automation" },
    });

    const nextState: LifecycleState = scheduledAt ? "eligible" : "invited";
    await this.updateLifecycleState(context, nextState, previousState);
    await this.markCandidateInvited(context);
    await this.persistBusinessEvent(context, WORKFLOW_EVENT_TYPES.InvitationSent, {
      invitationId: invitation.id,
      scheduledAt,
    });

    if (!scheduledAt) {
      await this.deps.invitationQueue.markSent(invitation.id);
    }

    return {
      action: "invite_candidate",
      success: true,
      lifecycleState: nextState,
      businessEvent: WORKFLOW_EVENT_TYPES.InvitationSent,
      invitationId: invitation.id,
      durationMs: Date.now() - started,
    };
  }

  private async createVerification(
    context: WorkflowContext,
    previousState: LifecycleState,
    started: number
  ): Promise<WorkflowExecutionResult> {
    const nextState: LifecycleState = "employment_verification";
    await this.updateLifecycleState(context, nextState, previousState);
    await this.persistBusinessEvent(context, WORKFLOW_EVENT_TYPES.VerificationRequested, {});
    return {
      action: "create_verification",
      success: true,
      lifecycleState: nextState,
      businessEvent: WORKFLOW_EVENT_TYPES.VerificationRequested,
      durationMs: Date.now() - started,
    };
  }

  private async requestReferences(
    context: WorkflowContext,
    previousState: LifecycleState,
    started: number
  ): Promise<WorkflowExecutionResult> {
    const nextState: LifecycleState = "reference_collection";
    await this.updateLifecycleState(context, nextState, previousState);
    await this.persistBusinessEvent(context, WORKFLOW_EVENT_TYPES.ReferenceRequested, {});
    return {
      action: "request_references",
      success: true,
      lifecycleState: nextState,
      businessEvent: WORKFLOW_EVENT_TYPES.ReferenceRequested,
      durationMs: Date.now() - started,
    };
  }

  private async archive(context: WorkflowContext, started: number): Promise<WorkflowExecutionResult> {
    await this.updateLifecycleState(context, "archived", context.currentState);
    await this.persistBusinessEvent(context, WORKFLOW_EVENT_TYPES.WorkflowCancelled, { reason: "archived" });
    return {
      action: "archive",
      success: true,
      lifecycleState: "archived",
      businessEvent: WORKFLOW_EVENT_TYPES.WorkflowCancelled,
      durationMs: Date.now() - started,
    };
  }

  private async sendReminder(
    context: WorkflowContext,
    previousState: LifecycleState,
    started: number
  ): Promise<WorkflowExecutionResult> {
    const pending = await this.deps.invitationQueue.listByCandidate(
      context.connectionId,
      context.externalCandidateId,
      "sent"
    );
    if (pending.length === 0) {
      return {
        action: "send_reminder",
        success: false,
        lifecycleState: previousState,
        durationMs: Date.now() - started,
        error: "No sent invitation to remind",
      };
    }
    return {
      action: "send_reminder",
      success: true,
      lifecycleState: previousState,
      durationMs: Date.now() - started,
    };
  }

  private async cancelInvitation(
    context: WorkflowContext,
    previousState: LifecycleState,
    started: number
  ): Promise<WorkflowExecutionResult> {
    const items = await this.deps.invitationQueue.listByCandidate(
      context.connectionId,
      context.externalCandidateId
    );
    for (const item of items) {
      if (item.status === "pending" || item.status === "scheduled") {
        await this.deps.invitationQueue.cancel(item.id);
      }
    }
    await this.updateLifecycleState(context, "cancelled", previousState);
    await this.persistBusinessEvent(context, WORKFLOW_EVENT_TYPES.WorkflowCancelled, {});
    return {
      action: "cancel_invitation",
      success: true,
      lifecycleState: "cancelled",
      businessEvent: WORKFLOW_EVENT_TYPES.WorkflowCancelled,
      durationMs: Date.now() - started,
    };
  }

  private async emitBusinessEvent(
    context: WorkflowContext,
    previousState: LifecycleState,
    eventType: string,
    action: WorkflowActionType,
    started: number
  ): Promise<WorkflowExecutionResult> {
    await this.persistBusinessEvent(context, eventType, {});
    return { action, success: true, lifecycleState: previousState, businessEvent: eventType, durationMs: Date.now() - started };
  }

  private async updateLifecycleState(
    context: WorkflowContext,
    state: LifecycleState,
    previousState?: LifecycleState
  ): Promise<void> {
    await this.deps.lifecycleState.upsert({
      connectionId: context.connectionId,
      employerAccountId: context.employerAccountId,
      externalCandidateId: context.externalCandidateId,
      state,
      previousState,
      lastEventType: context.action,
      lastDecision: context.decision,
      metadata: { correlationId: context.correlationId, ruleId: context.ruleId },
    });
  }

  private async markCandidateInvited(context: WorkflowContext): Promise<void> {
    if (!this.deps.candidateMap) return;
    const row = await this.deps.candidateMap.getByExternalId(context.connectionId, context.externalCandidateId);
    if (!row) return;
    await this.deps.candidateMap.upsert({
      ...row,
      metadata: { ...row.metadata, invited_at: nowIso(), invitation_correlation_id: context.correlationId },
    });
  }

  private async persistBusinessEvent(
    context: WorkflowContext,
    eventType: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    if (!this.deps.eventStore) return;
    await this.deps.eventStore.appendEvent({
      correlationId: context.correlationId,
      provider: context.provider,
      providerVersion: "1.0.0",
      connectVersion: CONNECT_PLATFORM_VERSION,
      companyId: context.employerAccountId,
      connectionId: context.connectionId,
      aggregateType: "candidate",
      aggregateId: context.externalCandidateId,
      eventType,
      providerEventType: "lifecycle_orchestration",
      payload: { ...payload, action: context.action, ruleId: context.ruleId },
      idempotencyKey: `workflow:${eventType}:${context.externalCandidateId}:${context.correlationId}`,
    });
  }
}
