import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ATS_EVENT_TYPES,
  AtsEventPipeline,
  AutomationRuleEvaluator,
  CandidateLifecycleEngine,
  ConnectSecureTokenStorage,
  ConnectionManager,
  DecisionEngine,
  InMemoryCandidateMapRepository,
  InMemoryConnectionRepository,
  InMemoryInvitationQueueRepository,
  InMemoryLifecycleStateRepository,
  InMemoryOAuthStateRepository,
  InMemoryProviderAccountRepository,
  InMemorySyncCheckpointRepository,
  InMemorySyncCursorRepository,
  LifecycleObservability,
  StructuredLoggingService,
  SyncCursorManager,
  SyncCursorService,
  WorkflowEngine,
  ConfigurationService,
  FeatureFlagService,
} from "@/lib/integrations";
import { EventDispatcher } from "@/lib/integrations/events/EventDispatcher";
import { DeadLetterQueue } from "@/lib/integrations/queue/DeadLetterQueue";
import { RetryService } from "@/lib/integrations/queue/RetryService";
import { EventValidator } from "@/lib/integrations/core/validation/event-validator";
import type { AtsApplication } from "@/lib/integrations/core/models/Application";
import type { AtsCandidate } from "@/lib/integrations/core/models/Candidate";
import type { AtsEventEnvelope } from "@/lib/integrations/core/events/ats-event-types";

describe("WorkVouch Connect — Sprint 7 Candidate Lifecycle", () => {
  let lifecycle: CandidateLifecycleEngine;
  let dispatcher: EventDispatcher;
  let invitationQueue: InMemoryInvitationQueueRepository;
  let lifecycleState: InMemoryLifecycleStateRepository;
  let connections: ConnectionManager;
  let connectionRepo: InMemoryConnectionRepository;
  let candidateMap: InMemoryCandidateMapRepository;
  let observability: LifecycleObservability;

  const candidate: AtsCandidate = {
    externalId: "cand-1",
    provider: "greenhouse",
    email: "jane@example.com",
    fullName: "Jane Chen",
    jobExternalId: "job-1",
  };

  const application: AtsApplication = {
    externalId: "app-1",
    provider: "greenhouse",
    candidateExternalId: "cand-1",
    jobExternalId: "job-1",
    status: "active",
    stageName: "Final Interview",
  };

  beforeEach(() => {
    const logger = new StructuredLoggingService();
    const config = new ConfigurationService();
    const retry = new RetryService(config);
    const dlq = new DeadLetterQueue(logger);
    dispatcher = new EventDispatcher(logger, config, retry, dlq);

    connectionRepo = new InMemoryConnectionRepository();
    invitationQueue = new InMemoryInvitationQueueRepository();
    lifecycleState = new InMemoryLifecycleStateRepository();
    candidateMap = new InMemoryCandidateMapRepository();
    observability = new LifecycleObservability();

    const cursorManager = new SyncCursorManager(
      new SyncCursorService(new InMemorySyncCursorRepository(), new InMemorySyncCheckpointRepository())
    );

    connections = new ConnectionManager({
      connections: connectionRepo,
      oauthStates: new InMemoryOAuthStateRepository(),
      providerAccounts: new InMemoryProviderAccountRepository(),
      tokenStorage: new ConnectSecureTokenStorage(),
      cursorManager,
    });

    lifecycle = new CandidateLifecycleEngine({
      connections,
      candidateMap,
      invitationQueue,
      lifecycleState,
      dispatcher,
      logger,
      observability,
    });
    lifecycle.subscribe();
  });

  afterEach(() => {
    lifecycle.unsubscribe();
    connectionRepo.clear();
    invitationQueue.clear();
    lifecycleState.clear();
    observability.clear();
  });

  async function seedConnection(prefs?: Record<string, unknown>) {
    await connectionRepo.create({
      id: "conn-1",
      employerAccountId: "employer-1",
      provider: "greenhouse",
      status: "connected",
      oauthScopes: ["harvest:read"],
      metadata: {
        sync_preferences: {
          automation: {
            auto_invite_enabled: true,
            auto_invite_trigger: "final_interview",
            job_filter_mode: "all",
            ...prefs,
          },
        },
      },
    });
    await candidateMap.upsert({
      connectionId: "conn-1",
      externalCandidateId: "cand-1",
      candidateEmail: candidate.email,
      candidateName: candidate.fullName,
      metadata: {},
    });
  }

  async function publishLifecycleEvent(
    eventType: string,
    entity: { candidate?: AtsCandidate; application?: AtsApplication }
  ) {
    const envelope: AtsEventEnvelope<typeof entity> = {
      universalEvent: eventType as AtsEventEnvelope["universalEvent"],
      providerEvent: "test",
      mapperUsed: "test",
      employerAccountId: "employer-1",
      connectionId: "conn-1",
      correlationId: "corr-test",
      translatedAt: new Date().toISOString(),
      durationMs: 1,
      validation: { valid: true, errors: [], warnings: [] },
      entity,
    };
    const published = dispatcher.publish({
      type: eventType,
      provider: "greenhouse",
      employerAccountId: "employer-1",
      connectionId: "conn-1",
      correlationId: "corr-test",
      payload: envelope,
    });
    await dispatcher.processEvent(published.id);
    return published;
  }

  it("evaluates automation rules for final interview trigger", () => {
    const evaluator = new AutomationRuleEvaluator();
    const result = evaluator.evaluate({
      universalEvent: ATS_EVENT_TYPES.CandidateMoved,
      providerEvent: "application_updated",
      connectionId: "conn-1",
      employerAccountId: "employer-1",
      application,
      stageName: "Final Interview",
      preferences: evaluator.parsePreferences({
        automation: { auto_invite_enabled: true, auto_invite_trigger: "final_interview" },
      }),
    });
    expect(result.eligible).toBe(true);
    expect(result.primaryRuleId).toBe("trigger_final_interview");
  });

  it("decision engine returns wait for manual-only mode", () => {
    const evaluator = new AutomationRuleEvaluator();
    const prefs = evaluator.parsePreferences({
      automation: { auto_invite_enabled: false, auto_invite_trigger: "manual" },
    });
    const evaluation = evaluator.evaluate({
      universalEvent: ATS_EVENT_TYPES.ApplicationCreated,
      providerEvent: "application_created",
      connectionId: "conn-1",
      employerAccountId: "employer-1",
      application,
      preferences: prefs,
    });
    const decision = new DecisionEngine().decide(
      {
        universalEvent: ATS_EVENT_TYPES.ApplicationCreated,
        providerEvent: "application_created",
        connectionId: "conn-1",
        employerAccountId: "employer-1",
        application,
        preferences: prefs,
      },
      evaluation
    );
    expect(decision.decision).toBe("wait");
  });

  it("auto-invites candidate on final interview stage", async () => {
    await seedConnection();
    await publishLifecycleEvent(ATS_EVENT_TYPES.CandidateMoved, { candidate, application });

    const invitations = await invitationQueue.listByCandidate("conn-1", "cand-1");
    expect(invitations.length).toBeGreaterThan(0);
    expect(invitations[0].candidateEmail).toBe("jane@example.com");

    const state = await lifecycleState.getByCandidate("conn-1", "cand-1");
    expect(state?.state).toBe("invited");
  });

  it("respects job filter when job not in selected list", async () => {
    await seedConnection({ job_filter_mode: "selected", job_filter_ids: ["other-job"] });
    await publishLifecycleEvent(ATS_EVENT_TYPES.CandidateMoved, { candidate, application });

    const invitations = await invitationQueue.listByCandidate("conn-1", "cand-1");
    expect(invitations.length).toBe(0);
  });

  it("archives rejected candidates", async () => {
    await seedConnection();
    await publishLifecycleEvent(ATS_EVENT_TYPES.CandidateRejected, {
      candidate,
      application: { ...application, status: "rejected" },
    });

    const state = await lifecycleState.getByCandidate("conn-1", "cand-1");
    expect(state?.state).toBe("archived");
  });

  it("skips duplicate invitations", async () => {
    await seedConnection();
    await candidateMap.upsert({
      connectionId: "conn-1",
      externalCandidateId: "cand-1",
      candidateEmail: candidate.email,
      candidateName: candidate.fullName,
      metadata: { invited_at: new Date().toISOString() },
    });

    await publishLifecycleEvent(ATS_EVENT_TYPES.CandidateMoved, { candidate, application });
    const invitations = await invitationQueue.listByCandidate("conn-1", "cand-1");
    expect(invitations.length).toBe(0);
  });

  it("tracks observability metrics", async () => {
    await seedConnection();
    await publishLifecycleEvent(ATS_EVENT_TYPES.CandidateMoved, { candidate, application });

    const snapshot = observability.getSnapshot();
    expect(snapshot.automationTriggers).toBeGreaterThan(0);
    expect(snapshot.workflowsSucceeded).toBeGreaterThan(0);
  });

  it("workflow engine executes invite with delay as scheduled", async () => {
    const engine = new WorkflowEngine({
      invitationQueue,
      lifecycleState,
      candidateMap,
    });
    const result = await engine.execute({
      connectionId: "conn-1",
      employerAccountId: "employer-1",
      correlationId: "corr-delay",
      externalCandidateId: "cand-1",
      candidateEmail: "jane@example.com",
      action: "invite_candidate",
      decision: "invite",
      delayMs: 3600000,
      provider: "greenhouse",
    });
    expect(result.success).toBe(true);
    expect(result.lifecycleState).toBe("eligible");
    const item = await invitationQueue.listByCandidate("conn-1", "cand-1");
    expect(item[0]?.status).toBe("scheduled");
  });
});
