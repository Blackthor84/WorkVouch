import { readFileSync } from "fs";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ATS_EVENT_TYPES,
  AtsEventPipeline,
  ConfigurationService,
  EventValidator,
  MockEventConsumer,
  StructuredLoggingService,
} from "@/lib/integrations";
import { EventDispatcher } from "@/lib/integrations/events/EventDispatcher";
import { DeadLetterQueue } from "@/lib/integrations/queue/DeadLetterQueue";
import { RetryService } from "@/lib/integrations/queue/RetryService";
import {
  createGreenhouseEventTranslator,
  mapGreenhouseCandidate,
  mapGreenhouseStageToStatus,
  parseGreenhouseWebhook,
  routeGreenhouseWebhook,
} from "@/lib/integrations/providers/greenhouse";

const FIXTURE_DIR = join(
  process.cwd(),
  "lib/integrations/providers/greenhouse/fixtures/greenhouse"
);

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), "utf8"));
}

function createPipelineHarness() {
  const logger = new StructuredLoggingService();
  const config = new ConfigurationService();
  const retry = new RetryService(config);
  const dlq = new DeadLetterQueue(logger);
  const dispatcher = new EventDispatcher(logger, config, retry, dlq);
  const validator = new EventValidator();
  const pipeline = new AtsEventPipeline(dispatcher, logger, validator);
  const consumer = new MockEventConsumer(logger);
  const translator = createGreenhouseEventTranslator(pipeline, validator);

  const subscriptions = Object.values(ATS_EVENT_TYPES).map((eventType) =>
    dispatcher.subscribe(eventType, consumer.createHandler())
  );

  return { logger, dispatcher, pipeline, consumer, translator, validator, subscriptions };
}

async function flushEvents(dispatcher: EventDispatcher): Promise<void> {
  const events = dispatcher.listEvents();
  await Promise.all(events.map((event) => dispatcher.processEvent(event.id)));
}

describe("Greenhouse Event Pipeline — Sprint 3B-2", () => {
  let harness: ReturnType<typeof createPipelineHarness>;

  beforeEach(() => {
    harness = createPipelineHarness();
  });

  afterEach(() => {
    harness.subscriptions.forEach((unsub) => unsub());
    harness.consumer.clear();
    harness.validator.reset();
  });

  const fixtureCases = [
    ["candidate-created.json", ATS_EVENT_TYPES.CandidateCreated],
    ["candidate-updated.json", ATS_EVENT_TYPES.CandidateUpdated],
    ["job-created.json", ATS_EVENT_TYPES.JobCreated],
    ["application-created.json", ATS_EVENT_TYPES.ApplicationCreated],
    ["offer-created.json", ATS_EVENT_TYPES.OfferCreated],
    ["offer-accepted.json", ATS_EVENT_TYPES.OfferAccepted],
    ["candidate-hired.json", ATS_EVENT_TYPES.CandidateHired],
    ["candidate-rejected.json", ATS_EVENT_TYPES.CandidateRejected],
    ["webhook-example.json", ATS_EVENT_TYPES.CandidateMoved],
  ] as const;

  it.each(fixtureCases)(
    "translates fixture %s through mapper → bus → consumer → logs",
    async (fixtureName, expectedEvent) => {
      const raw = loadFixture(fixtureName);
      const result = harness.translator.translateAndPublish({
        rawPayload: raw,
        employerAccountId: "employer-1",
        connectionId: "conn-1",
        correlationId: `corr-${fixtureName}`,
      });

      expect(result.published).toBe(true);
      expect(result.universalEvent).toBe(expectedEvent);

      await flushEvents(harness.dispatcher);

      const records = harness.consumer.getRecords();
      expect(records.length).toBeGreaterThanOrEqual(1);
      const record = records.find((item) => item.event.type === expectedEvent);
      expect(record).toBeTruthy();
      expect(record!.schemaValid).toBe(true);
      expect(record!.event.payload.mapperUsed).toBeTruthy();
      expect(record!.event.payload.validation.valid).toBe(true);

      const logs = harness.logger.getEntries(50);
      const translationLog = logs.find(
        (entry) =>
          entry.metadata?.universalEvent === expectedEvent &&
          entry.metadata?.validationResult === "valid"
      );
      expect(translationLog).toBeTruthy();
      expect(translationLog!.metadata?.providerEvent).toBeTruthy();
      expect(translationLog!.metadata?.mapperUsed).toBeTruthy();
    }
  );

  it("maps Greenhouse stage names to universal application status", () => {
    expect(mapGreenhouseStageToStatus("Application Review")).toBe("applied");
    expect(mapGreenhouseStageToStatus("Final Interview")).toBe("interview");
    expect(mapGreenhouseStageToStatus("Offer")).toBe("offer");
    expect(mapGreenhouseStageToStatus("Unknown Stage")).toBe("unknown");
  });

  it("routes webhook actions to universal event types", () => {
    const webhook = parseGreenhouseWebhook(loadFixture("application-created.json"));
    const route = routeGreenhouseWebhook(webhook.action);
    expect(route?.universalEvent).toBe(ATS_EVENT_TYPES.ApplicationCreated);
    expect(route?.mapperUsed).toBe("greenhouse.applicationMapper");
  });

  it("maps candidate fixture to universal AtsCandidate model", () => {
    const webhook = parseGreenhouseWebhook(loadFixture("candidate-created.json"));
    const candidate = mapGreenhouseCandidate(webhook.payload as never);
    expect(candidate.externalId).toBe("12345");
    expect(candidate.email).toBe("jane.chen@email.com");
    expect(candidate.provider).toBe("greenhouse");
    expect(candidate.trustStatus).toBe("not_linked");
  });

  it("rejects malformed payloads with typed validation errors", () => {
    const result = harness.translator.translateAndPublish({
      rawPayload: { action: "candidate_created" },
      employerAccountId: "employer-1",
      connectionId: "conn-1",
    });
    expect(result.published).toBe(false);
    expect(result.validation.valid).toBe(false);
    expect(result.validation.errors[0]?.code).toBe("MALFORMED_PAYLOAD");
  });

  it("deduplicates events via dispatcher idempotency key", async () => {
    const raw = loadFixture("candidate-created.json");
    const first = harness.translator.translateAndPublish({
      rawPayload: raw,
      employerAccountId: "employer-1",
      connectionId: "conn-1",
    });
    expect(first.published).toBe(true);
    await flushEvents(harness.dispatcher);

    harness.validator.reset();

    const duplicate = harness.translator.translateAndPublish({
      rawPayload: raw,
      employerAccountId: "employer-1",
      connectionId: "conn-1",
    });
    expect(duplicate.published).toBe(true);
    expect(harness.dispatcher.listEvents().length).toBe(1);
  });

  it("detects duplicate event IDs in validator", () => {
    const context = { eventId: "evt-dup-1", eventType: ATS_EVENT_TYPES.CandidateCreated };
    const first = harness.validator.validateEventContext(context);
    const second = harness.validator.validateEventContext(context);
    expect(first.valid).toBe(true);
    expect(second.valid).toBe(false);
    expect(second.errors[0]?.code).toBe("DUPLICATE_EVENT");
  });

  it("detects out-of-order events", () => {
    const base = {
      eventType: ATS_EVENT_TYPES.CandidateMoved,
    };
    harness.validator.validateEventContext({
      ...base,
      eventId: "67890:application:1",
      sequenceNumber: 2,
    });
    const outOfOrder = harness.validator.validateEventContext({
      ...base,
      eventId: "67890:application:2",
      sequenceNumber: 1,
    });
    expect(outOfOrder.valid).toBe(false);
    expect(outOfOrder.errors[0]?.code).toBe("OUT_OF_ORDER_EVENT");
  });

  it("mock consumer logs provider, universal event, mapper, and validation result", async () => {
    harness.translator.translateAndPublish({
      rawPayload: loadFixture("job-created.json"),
      employerAccountId: "employer-1",
      connectionId: "conn-1",
      correlationId: "corr-consumer-test",
    });

    await flushEvents(harness.dispatcher);

    const logs = harness.logger.getEntries(20);
    const consumerLog = logs.find(
      (entry) => entry.metadata?.universalEvent === ATS_EVENT_TYPES.JobCreated
    );
    expect(consumerLog?.metadata?.universalEvent).toBe(ATS_EVENT_TYPES.JobCreated);
    expect(consumerLog?.metadata?.providerEvent).toBe("job_created");
    expect(consumerLog?.metadata?.mapperUsed).toBe("greenhouse.jobMapper");
    expect(consumerLog?.metadata?.validationResult).toBe("valid");
    expect(consumerLog?.correlationId).toBeTruthy();
    expect(consumerLog?.companyId).toBe("employer-1");
  });
});
