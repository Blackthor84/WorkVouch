import { readFileSync } from "fs";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ATS_EVENT_TYPES,
  AtsEventPipeline,
  ConfigurationService,
  EventValidator,
  FeatureFlagService,
  MockEventConsumer,
  StructuredLoggingService,
  createConnectPlatform,
  createGreenhouseEventTranslator,
} from "@/lib/integrations";
import { EventDispatcher } from "@/lib/integrations/events/EventDispatcher";
import { DeadLetterQueue } from "@/lib/integrations/queue/DeadLetterQueue";
import { RetryService } from "@/lib/integrations/queue/RetryService";
import { ProviderLoader, ProviderRegistry } from "@/lib/integrations/registry";
import { HealthService } from "@/lib/integrations/health/HealthService";

const REPLAY_FIXTURE_DIR = join(process.cwd(), "lib/integrations/connect/fixtures/replay");
const GH_FIXTURE_DIR = join(
  process.cwd(),
  "lib/integrations/providers/greenhouse/fixtures/greenhouse"
);

function loadReplayFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(REPLAY_FIXTURE_DIR, name), "utf8"));
}

function loadGhFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(GH_FIXTURE_DIR, name), "utf8"));
}

function createConnectHarness() {
  process.env.ATS_ENABLED = "true";
  process.env.GREENHOUSE_ENABLED = "true";
  process.env.GREENHOUSE_CLIENT_ID = "gh-test";
  process.env.GREENHOUSE_CLIENT_SECRET = "gh-secret";

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

  const connect = createConnectPlatform({
    dispatcher,
    deadLetterQueue: dlq,
    logger,
    config,
    featureFlags,
    registry,
    health: new HealthService(logger),
    validator,
    consumer,
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
        universalModel: result.validation?.valid ? { replayed: true } : undefined,
        durationMs: result.durationMs,
        reason: result.reason,
      };
    },
  });

  Object.values(ATS_EVENT_TYPES).forEach((type) => {
    dispatcher.subscribe(type, consumer.createHandler());
  });

  return { connect, translator, dispatcher, consumer, logger, validator };
}

describe("WorkVouch Connect — Sprint 3B-3", () => {
  let harness: ReturnType<typeof createConnectHarness>;

  beforeEach(() => {
    harness = createConnectHarness();
  });

  afterEach(() => {
    harness.connect.reset();
    delete process.env.GREENHOUSE_CLIENT_ID;
    delete process.env.GREENHOUSE_CLIENT_SECRET;
  });

  async function processAndRecord(raw: unknown, correlationId = "corr-connect-test") {
    const record = harness.connect.recordReceived({
      correlationId,
      provider: "greenhouse",
      rawPayload: raw,
      employerAccountId: "employer-1",
      connectionId: "conn-1",
    });
    const result = harness.translator.translateAndPublish({
      rawPayload: raw,
      employerAccountId: "employer-1",
      connectionId: "conn-1",
      correlationId,
    });
    harness.connect.captureTranslation({
      correlationId,
      provider: "greenhouse",
      rawPayload: raw,
      employerAccountId: "employer-1",
      connectionId: "conn-1",
      providerEvent: result.providerEvent,
      universalEvent: result.universalEvent,
      validation: result.validation,
      translation: result.mapperUsed
        ? {
            mapperUsed: result.mapperUsed,
            providerEvent: result.providerEvent ?? "",
            universalEvent: result.universalEvent ?? "",
            durationMs: result.durationMs,
          }
        : undefined,
      published: result.published,
      busEventId: result.eventId,
    });
    if (result.eventId) {
      const busEvent = harness.dispatcher.getEvent(result.eventId);
      if (busEvent) harness.connect.attachBusEvent(record.id, busEvent);
    }
    await Promise.all(harness.dispatcher.listEvents().map((e) => harness.dispatcher.processEvent(e.id)));
    harness.connect.captureConsumed(record.id);
    return { record, result };
  }

  it("records full audit trail for translated events", async () => {
    const { record } = await processAndRecord(loadGhFixture("candidate-created.json"));
    const trail = harness.connect.getAuditTrail(record.id);
    expect(trail.map((e) => e.action)).toContain("received");
    expect(trail.map((e) => e.action)).toContain("validated");
    expect(trail.map((e) => e.action)).toContain("mapped");
    expect(trail.map((e) => e.action)).toContain("published");
    expect(trail.map((e) => e.action)).toContain("consumed");
  });

  it("inspects event payload, universal model, validation, and translation", async () => {
    const { record } = await processAndRecord(loadGhFixture("application-created.json"));
    const inspection = harness.connect.inspectEvent(record.id);
    expect(inspection).toBeTruthy();
    expect(inspection!.payload).toBeTruthy();
    expect(inspection!.translation?.mapperUsed).toBe("greenhouse.applicationMapper");
    expect(inspection!.validation?.valid).toBe(true);
    expect(inspection!.timeline.length).toBeGreaterThan(0);
  });

  it("lists and filters events", async () => {
    await processAndRecord(loadGhFixture("candidate-created.json"), "corr-a");
    await processAndRecord(loadGhFixture("job-created.json"), "corr-b");
    const all = harness.connect.listEvents();
    expect(all.length).toBe(2);
    const filtered = harness.connect.listEvents({ universalEvent: ATS_EVENT_TYPES.JobCreated });
    expect(filtered.length).toBe(1);
  });

  it("generates timeline with stages and durations", async () => {
    const { record } = await processAndRecord(loadGhFixture("offer-accepted.json"));
    const timeline = harness.connect.getTimeline(record.id);
    expect(timeline.some((s) => s.stage === "received")).toBe(true);
    expect(timeline.some((s) => s.stage === "mapped" || s.stage === "published")).toBe(true);
  });

  it("explores correlation ID across events and logs", async () => {
    const correlationId = "corr-explore-123";
    await processAndRecord(loadGhFixture("candidate-hired.json"), correlationId);
    const exploration = harness.connect.exploreCorrelation(correlationId);
    expect(exploration.events.length).toBe(1);
    expect(exploration.timeline.length).toBeGreaterThan(0);
    expect(exploration.auditTrail.length).toBeGreaterThan(0);
  });

  it("simulates replay without duplicate persistence", async () => {
    const { record } = await processAndRecord(loadReplayFixture("candidate-created.json"));
    const before = harness.connect.listEvents().length;
    const replay = harness.connect.simulateReplay(record.id);
    expect(replay.mode).toBe("dry_run");
    expect(replay.success).toBe(true);
    expect(replay.duplicatePrevented).toBe(false);
    expect(harness.connect.listEvents().length).toBe(before);
  });

  it("replays batch in simulation mode", async () => {
    const { record: r1 } = await processAndRecord(loadReplayFixture("candidate-created.json"), "batch-1");
    const { record: r2 } = await processAndRecord(loadReplayFixture("candidate-hired.json"), "batch-2");
    const results = harness.connect.replay.replayBatch([r1.id, r2.id], { simulate: true, dryRun: true });
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.success)).toBe(true);
  });

  it("validates payloads and rejects invalid fixtures", () => {
    const valid = harness.connect.validatePayload(loadReplayFixture("candidate-created.json"));
    expect(valid.valid).toBe(true);
    const invalid = harness.connect.validatePayload(loadReplayFixture("invalid-payload.json"));
    expect(invalid.valid).toBe(false);
  });

  it("compares payloads for drift detection", async () => {
    const { record } = await processAndRecord(loadReplayFixture("duplicate-event.json"));
    const same = harness.connect.comparePayloads(record.id, loadReplayFixture("duplicate-event.json"));
    expect(same.equal).toBe(true);
    const diff = harness.connect.comparePayloads(record.id, { action: "other", payload: {} });
    expect(diff.equal).toBe(false);
  });

  it("runs platform diagnostics", () => {
    const report = harness.connect.runDiagnostics();
    expect(report.platform).toBe("WorkVouch Connect");
    expect(report.providers.some((p) => p.providerId === "greenhouse")).toBe(true);
    expect(report.featureFlags).toBeTruthy();
  });

  it("supports replay fixtures for key scenarios", async () => {
    const fixtures = [
      "candidate-created.json",
      "candidate-updated.json",
      "offer-accepted.json",
      "candidate-hired.json",
      "candidate-rejected.json",
      "webhook-retry.json",
    ];
    for (const fixture of fixtures) {
      const { record, result } = await processAndRecord(loadReplayFixture(fixture), `corr-${fixture}`);
      expect(result.published).toBe(true);
      const replay = harness.connect.simulateReplay(record.id);
      expect(replay.success).toBe(true);
    }
  });

  it("records failed translation for invalid payload without persisting bus event", async () => {
    const raw = loadReplayFixture("invalid-payload.json");
    const record = harness.connect.recordReceived({
      correlationId: "corr-invalid",
      provider: "greenhouse",
      rawPayload: raw,
      employerAccountId: "employer-1",
      connectionId: "conn-1",
    });
    const result = harness.translator.translateAndPublish({
      rawPayload: raw,
      employerAccountId: "employer-1",
      connectionId: "conn-1",
      correlationId: "corr-invalid",
    });
    harness.connect.captureTranslation({
      correlationId: "corr-invalid",
      provider: "greenhouse",
      rawPayload: raw,
      employerAccountId: "employer-1",
      connectionId: "conn-1",
      published: false,
      validation: result.validation,
    });
    expect(result.published).toBe(false);
    const trail = harness.connect.getAuditTrail(record.id);
    expect(trail.some((e) => e.action === "failed")).toBe(true);
  });
});
