import { readFileSync } from "fs";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AtsEventPipeline,
  ConfigurationService,
  ConnectEventStore,
  EventValidator,
  FeatureFlagService,
  InMemoryEventStoreRepository,
  InMemoryProjectionRepository,
  MockEventConsumer,
  ProjectionEngine,
  StructuredLoggingService,
  createConnectPlatform,
  createGreenhouseEventTranslator,
} from "@/lib/integrations";
import { EventDispatcher } from "@/lib/integrations/events/EventDispatcher";
import { DeadLetterQueue } from "@/lib/integrations/queue/DeadLetterQueue";
import { RetryService } from "@/lib/integrations/queue/RetryService";
import { ProviderLoader, ProviderRegistry } from "@/lib/integrations/registry";
import { HealthService } from "@/lib/integrations/health/HealthService";

const GH_FIXTURE_DIR = join(
  process.cwd(),
  "lib/integrations/providers/greenhouse/fixtures/greenhouse"
);

function loadGhFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(GH_FIXTURE_DIR, name), "utf8"));
}

describe("WorkVouch Connect — Sprint 4 Persistence Integration", () => {
  let eventStoreRepo: InMemoryEventStoreRepository;
  let eventStore: ConnectEventStore;
  let projectionEngine: ProjectionEngine;

  beforeEach(() => {
    process.env.ATS_ENABLED = "true";
    process.env.GREENHOUSE_ENABLED = "true";
    process.env.GREENHOUSE_CLIENT_ID = "gh-test";
    process.env.GREENHOUSE_CLIENT_SECRET = "gh-secret";

    eventStoreRepo = new InMemoryEventStoreRepository();
    eventStore = new ConnectEventStore(eventStoreRepo);
    projectionEngine = new ProjectionEngine(eventStore, new InMemoryProjectionRepository());
  });

  afterEach(() => {
    eventStoreRepo.clear();
  });

  function createHarness() {
    const logger = new StructuredLoggingService();
    const config = new ConfigurationService();
    const featureFlags = new FeatureFlagService();
    const retry = new RetryService(config);
    const dlq = new DeadLetterQueue(logger);
    const dispatcher = new EventDispatcher(logger, config, retry, dlq);
    const validator = new EventValidator();
    const pipeline = new AtsEventPipeline(dispatcher, logger, validator);
    const consumer = new MockEventConsumer(logger);
    const translator = createGreenhouseEventTranslator(pipeline, validator);
    const registry = new ProviderRegistry(featureFlags, logger);
    new ProviderLoader(registry).loadBuiltInProviders();

    return createConnectPlatform({
      dispatcher,
      deadLetterQueue: dlq,
      logger,
      config,
      featureFlags,
      registry,
      health: new HealthService(logger),
      validator,
      consumer,
      eventStore,
      projectionEngine,
      providerVersion: "1.0.0",
      translator: (input) => {
        const result = translator.translateAndPublish({
          rawPayload: input.rawPayload,
          employerAccountId: input.employerAccountId,
          connectionId: input.connectionId,
          correlationId: input.correlationId,
        });
        return {
          published: result.published,
          universalEvent: result.universalEvent,
          providerEvent: result.providerEvent,
          mapperUsed: result.mapperUsed,
          validation: result.validation,
          universalModel: result.universalModel,
          durationMs: result.durationMs,
          reason: result.reason,
        };
      },
    });
  }

  it("persists translated events to event store on captureTranslation", async () => {
    const connect = createHarness();
    const rawPayload = loadGhFixture("candidate-created.json");
    const correlationId = "persist-corr-1";

    connect.recordReceived({
      correlationId,
      provider: "greenhouse",
      rawPayload,
      employerAccountId: "employer-1",
      connectionId: "conn-1",
    });

    const result = connect.captureTranslation({
      correlationId,
      provider: "greenhouse",
      rawPayload,
      employerAccountId: "employer-1",
      connectionId: "conn-1",
      published: true,
      busEventId: "bus-1",
      universalEvent: "ats.candidate.created",
      providerEvent: "candidate_created",
      universalModel: { candidate: { externalId: "12345", email: "jane@example.com" } },
      validation: { valid: true, errors: [] },
      translation: { mapperUsed: "GreenhouseCandidateMapper", durationMs: 12 },
    });

    await connect.flushPersistence();

    const persisted = connect.getEvent(result.id);
    expect(persisted?.metadata?.storedEventId).toBeDefined();
    expect(eventStoreRepo.size()).toBe(1);

    const timeline = await connect.loadPersistedTimeline(correlationId);
    expect(timeline).toHaveLength(1);
    expect(timeline[0].eventType).toBe("ats.candidate.created");
  });

  it("derives candidate projection after persistence", async () => {
    const connect = createHarness();
    const aggregateId = "candidate-proj-1";

    connect.captureTranslation({
      correlationId: "proj-corr-1",
      provider: "greenhouse",
      rawPayload: loadGhFixture("candidate-created.json"),
      employerAccountId: "employer-1",
      connectionId: "conn-1",
      published: true,
      busEventId: "bus-1",
      universalEvent: "ats.candidate.created",
      providerEvent: "candidate_created",
      universalModel: {
        entity: {
          candidate: { externalId: aggregateId, email: "proj@example.com", applicationStatus: "applied" },
        },
      },
      validation: { valid: true, errors: [] },
      translation: { mapperUsed: "GreenhouseCandidateMapper", durationMs: 8 },
    });

    connect.captureTranslation({
      correlationId: "proj-corr-2",
      provider: "greenhouse",
      rawPayload: loadGhFixture("candidate-hired.json"),
      employerAccountId: "employer-1",
      connectionId: "conn-1",
      published: true,
      busEventId: "bus-2",
      universalEvent: "ats.candidate.hired",
      providerEvent: "candidate_hired",
      universalModel: {
        entity: {
          candidate: { externalId: aggregateId, applicationStatus: "hired" },
        },
      },
      validation: { valid: true, errors: [] },
      translation: { mapperUsed: "GreenhouseCandidateMapper", durationMs: 6 },
    });

    await connect.flushPersistence();

    const projection = await connect.projectState("candidate", aggregateId);
    expect(projection?.state.applicationStatus).toBe("hired");
    expect(projection?.sequenceNumber).toBe(2);
  });

  it("replays aggregate from event store in dry-run mode", async () => {
    const connect = createHarness();
    const aggregateId = "replay-agg-1";

    for (const [index, eventType] of ["ats.candidate.created", "ats.candidate.updated"].entries()) {
      connect.captureTranslation({
        correlationId: `replay-corr-${index}`,
        provider: "greenhouse",
        rawPayload: {},
        employerAccountId: "employer-1",
        connectionId: "conn-1",
        published: true,
        busEventId: `bus-${index}`,
        universalEvent: eventType,
        providerEvent: eventType.replace("ats.", ""),
        universalModel: { entity: { candidate: { externalId: aggregateId } } },
        validation: { valid: true, errors: [] },
        translation: { mapperUsed: "GreenhouseCandidateMapper", durationMs: 5 },
      });
    }

    await connect.flushPersistence();

    const replay = await connect.replayAggregate("candidate", aggregateId, true);
    expect(replay.events).toHaveLength(2);
    expect(replay.dryRun).toBe(true);
    expect(eventStoreRepo.size()).toBe(2);
  });

  it("audit service reads trail from event store by correlation", async () => {
    const connect = createHarness();
    const correlationId = "audit-corr-1";

    connect.captureTranslation({
      correlationId,
      provider: "greenhouse",
      rawPayload: {},
      employerAccountId: "employer-1",
      connectionId: "conn-1",
      published: true,
      busEventId: "bus-audit",
      universalEvent: "ats.candidate.created",
      providerEvent: "candidate_created",
      universalModel: { entity: { candidate: { externalId: "audit-1" } } },
      validation: { valid: true, errors: [] },
      translation: { mapperUsed: "GreenhouseCandidateMapper", durationMs: 4 },
    });

    await connect.flushPersistence();

    const trail = await connect.audit.getTrailFromStore(correlationId);
    expect(trail.length).toBeGreaterThan(0);
    expect(trail.some((e) => e.action === "received")).toBe(true);
  });

  it("replay service replays from event store without duplicate append", async () => {
    const connect = createHarness();
    const aggregateId = "replay-svc-1";

    connect.captureTranslation({
      correlationId: "replay-svc-corr",
      provider: "greenhouse",
      rawPayload: {},
      employerAccountId: "employer-1",
      connectionId: "conn-1",
      published: true,
      busEventId: "bus-replay",
      universalEvent: "ats.job.created",
      providerEvent: "job_created",
      universalModel: { entity: { job: { externalId: aggregateId, title: "Engineer" } } },
      validation: { valid: true, errors: [] },
      translation: { mapperUsed: "GreenhouseJobMapper", durationMs: 3 },
    });

    await connect.flushPersistence();
    const before = eventStoreRepo.size();

    const result = await connect.replay.replayFromEventStore("job", aggregateId, { dryRun: true });
    expect(result.success).toBe(true);
    expect(result.streamEvents).toBe(1);
    expect(eventStoreRepo.size()).toBe(before);
  });
});
