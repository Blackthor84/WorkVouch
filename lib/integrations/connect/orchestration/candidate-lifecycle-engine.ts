import type { IntegrationEvent } from "../../types/events";
import type { AtsEventEnvelope } from "../../core/events/ats-event-types";
import type { AtsApplication } from "../../core/models/Application";
import type { AtsCandidate } from "../../core/models/Candidate";
import type { LoggingService } from "../../logging/LoggingService";
import type { ConnectionManager } from "../connection/connection-manager";
import type { CandidateMapRepository } from "../persistence/repositories/candidate-map-repository";
import type { InvitationQueueRepository } from "../persistence/repositories/invitation-queue-repository";
import type { LifecycleStateRepository } from "../persistence/repositories/lifecycle-state-repository";
import type { ConnectEventStore } from "../event-store/connect-event-store";
import { ATS_EVENT_TYPES, ALL_ATS_EVENT_TYPES } from "../../core/events/ats-event-types";
import type { EventDispatcher } from "../../events/EventDispatcher";
import { AutomationRuleEvaluator } from "./automation-rule-evaluator";
import { DecisionEngine } from "./decision-engine";
import { WorkflowEngine } from "./workflow-engine";
import { LifecycleObservability } from "./lifecycle-observability";
import type { LifecycleOrchestrationResult, LifecycleState } from "./types";

export interface CandidateLifecycleEngineDeps {
  connections: ConnectionManager;
  candidateMap: CandidateMapRepository;
  invitationQueue: InvitationQueueRepository;
  lifecycleState: LifecycleStateRepository;
  eventStore?: ConnectEventStore;
  dispatcher: EventDispatcher;
  logger: LoggingService;
  observability?: LifecycleObservability;
}

/** Orchestrates candidate lifecycle decisions when ATS events arrive. */
export class CandidateLifecycleEngine {
  private readonly ruleEvaluator = new AutomationRuleEvaluator();
  private readonly decisionEngine = new DecisionEngine();
  private readonly workflowEngine: WorkflowEngine;
  private readonly observability: LifecycleObservability;
  private unsubscribers: Array<() => void> = [];

  constructor(private readonly deps: CandidateLifecycleEngineDeps) {
    this.workflowEngine = new WorkflowEngine({
      invitationQueue: deps.invitationQueue,
      lifecycleState: deps.lifecycleState,
      candidateMap: deps.candidateMap,
      eventStore: deps.eventStore,
    });
    this.observability = deps.observability ?? new LifecycleObservability();
  }

  /** Subscribe to all universal ATS events on the event bus. */
  subscribe(): void {
    for (const eventType of ALL_ATS_EVENT_TYPES) {
      const unsub = this.deps.dispatcher.subscribe(eventType, (event) => this.handleEvent(event));
      this.unsubscribers.push(unsub);
    }
    this.deps.logger.info("CandidateLifecycleEngine subscribed to ATS events", {
      metadata: { eventCount: ALL_ATS_EVENT_TYPES.length },
    });
  }

  unsubscribe(): void {
    this.unsubscribers.forEach((fn) => fn());
    this.unsubscribers = [];
  }

  async handleEvent(event: IntegrationEvent): Promise<LifecycleOrchestrationResult | null> {
    const started = Date.now();
    const envelope = event.payload as AtsEventEnvelope<{ candidate?: AtsCandidate; application?: AtsApplication }>;
    if (!envelope?.universalEvent) return null;

    const { candidate, application } = this.extractEntities(envelope);
    const externalCandidateId =
      candidate?.externalId ?? application?.candidateExternalId ?? "";
    if (!externalCandidateId || !event.connectionId || !event.employerAccountId) {
      return null;
    }

    const connection = await this.deps.connections.getConnection(event.connectionId);
    const preferences = this.ruleEvaluator.parsePreferences(connection?.metadata?.sync_preferences);
    const candidateRow = await this.deps.candidateMap.getByExternalId(event.connectionId, externalCandidateId);
    const lifecycleRow = await this.deps.lifecycleState.getByCandidate(event.connectionId, externalCandidateId);
    const alreadyInvited = Boolean(candidateRow?.metadata?.invited_at);

    const evalContext = {
      universalEvent: envelope.universalEvent,
      providerEvent: envelope.providerEvent,
      connectionId: event.connectionId,
      employerAccountId: event.employerAccountId,
      candidate,
      application,
      stageName: application?.stageName,
      preferences,
      currentState: lifecycleRow?.state,
      alreadyInvited,
    };

    const evaluation = this.ruleEvaluator.evaluate(evalContext);
    const decision = this.decisionEngine.decide(evalContext, evaluation);

    const workflow = await this.workflowEngine.execute({
      connectionId: event.connectionId,
      employerAccountId: event.employerAccountId,
      correlationId: event.correlationId,
      externalCandidateId,
      candidateEmail: candidate?.email,
      candidateName: candidate?.fullName,
      jobExternalId: application?.jobExternalId ?? candidate?.jobExternalId,
      action: decision.action,
      decision: decision.decision,
      ruleId: decision.ruleId,
      delayMs: decision.delayMs,
      currentState: lifecycleRow?.state ?? this.initialState(envelope.universalEvent),
      provider: event.provider,
    });

    const result: LifecycleOrchestrationResult = {
      correlationId: event.correlationId,
      connectionId: event.connectionId,
      employerAccountId: event.employerAccountId,
      universalEvent: envelope.universalEvent,
      evaluation,
      decision,
      workflow,
      previousState: lifecycleRow?.state ?? "imported",
      nextState: workflow.lifecycleState,
      durationMs: Date.now() - started,
    };

    this.observability.record({
      correlationId: event.correlationId,
      connectionId: event.connectionId,
      employerAccountId: event.employerAccountId,
      universalEvent: envelope.universalEvent,
      ruleMatched: evaluation.primaryRuleId,
      decision: decision.decision,
      action: decision.action,
      workflowResult: workflow.success ? "success" : "failure",
      durationMs: result.durationMs,
      metadata: { reason: decision.reason, invitationId: workflow.invitationId },
    });

    this.deps.logger.info("Lifecycle orchestration completed", {
      provider: event.provider,
      correlationId: event.correlationId,
      event: envelope.universalEvent,
      companyId: event.employerAccountId,
      metadata: {
        decision: decision.decision,
        action: decision.action,
        nextState: workflow.lifecycleState,
        durationMs: result.durationMs,
      },
    });

    return result;
  }

  getObservability(): LifecycleObservability {
    return this.observability;
  }

  async processScheduledInvitations(): Promise<number> {
    const due = await this.deps.invitationQueue.processDueScheduled();
    return due.length;
  }

  private extractEntities(envelope: AtsEventEnvelope<{ candidate?: AtsCandidate; application?: AtsApplication }>) {
    const entity = envelope.entity ?? {};
    return {
      candidate: entity.candidate,
      application: entity.application,
    };
  }

  private initialState(eventType: string): LifecycleState {
    if (eventType === ATS_EVENT_TYPES.CandidateCreated) return "imported";
    if (eventType === ATS_EVENT_TYPES.ApplicationCreated) return "pending";
    return "imported";
  }
}
