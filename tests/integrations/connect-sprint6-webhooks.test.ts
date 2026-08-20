import { readFileSync } from "fs";
import { join } from "path";
import { createHmac } from "crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AtsEventPipeline,
  ConnectEventStore,
  ConnectSecureTokenStorage,
  ConnectionManager,
  ConfigurationService,
  FeatureFlagService,
  InMemoryCandidateMapRepository,
  InMemoryConnectionRepository,
  InMemoryEventStoreRepository,
  InMemoryJobMapRepository,
  InMemoryOAuthStateRepository,
  InMemoryProjectionRepository,
  InMemoryProviderAccountRepository,
  InMemorySyncCheckpointRepository,
  InMemorySyncCursorRepository,
  InMemoryWebhookRepository,
  ProjectionEngine,
  StructuredLoggingService,
  SyncCursorManager,
  SyncCursorService,
  WebhookMetrics,
  WebhookService,
} from "@/lib/integrations";
import { ConnectPlatform, createConnectPlatform } from "@/lib/integrations/connect/connect-platform";
import { GreenhouseWebhookProcessor } from "@/lib/integrations/connect/webhooks/greenhouse-webhook-processor";
import { verifyGreenhouseWebhookSignature } from "@/lib/integrations/providers/greenhouse/auth/webhook-signature";
import { createGreenhouseProvider } from "@/lib/integrations/providers/greenhouse/provider";
import { EventDispatcher } from "@/lib/integrations/events/EventDispatcher";
import { DeadLetterQueue } from "@/lib/integrations/queue/DeadLetterQueue";
import { RetryService } from "@/lib/integrations/queue/RetryService";
import { ProviderRegistry } from "@/lib/integrations/registry/ProviderRegistry";
import { HealthService } from "@/lib/integrations/health/HealthService";
import { EventValidator } from "@/lib/integrations/core/validation/event-validator";
import { MockEventConsumer } from "@/lib/integrations/core/consumers/mock-event-consumer";
import { routeGreenhouseWebhook } from "@/lib/integrations/providers/greenhouse/mappers/webhookMapper";

const FIXTURE_DIR = join(process.cwd(), "lib/integrations/providers/greenhouse/fixtures/greenhouse");
const WEBHOOK_SECRET = "test-webhook-secret";

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), "utf8"));
}

function signBody(rawBody: string, secret = WEBHOOK_SECRET): string {
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  return `sha256=${digest}`;
}

describe("WorkVouch Connect — Sprint 6 Live Webhooks", () => {
  let connections: ConnectionManager;
  let eventStore: ConnectEventStore;
  let webhooks: WebhookService;
  let webhookRepo: InMemoryWebhookRepository;
  let eventStoreRepo: InMemoryEventStoreRepository;
  let connectionRepo: InMemoryConnectionRepository;
  let dlq: DeadLetterQueue;
  let cursorManager: SyncCursorManager;
  let connect: ConnectPlatform;
  let metrics: WebhookMetrics;

  beforeEach(() => {
    process.env.ATS_ENABLED = "true";
    process.env.GREENHOUSE_ENABLED = "true";
    process.env.GREENHOUSE_CLIENT_ID = "gh-test";
    process.env.GREENHOUSE_CLIENT_SECRET = "gh-secret";
    process.env.GREENHOUSE_WEBHOOK_SECRET = WEBHOOK_SECRET;

    const logger = new StructuredLoggingService();
    const config = new ConfigurationService();
    const retry = new RetryService(config);
    dlq = new DeadLetterQueue(logger);
    const dispatcher = new EventDispatcher(logger, config, retry, dlq);
    const validator = new EventValidator();

    webhookRepo = new InMemoryWebhookRepository();
    eventStoreRepo = new InMemoryEventStoreRepository();
    connectionRepo = new InMemoryConnectionRepository();

    const cursorService = new SyncCursorService(
      new InMemorySyncCursorRepository(),
      new InMemorySyncCheckpointRepository()
    );
    cursorManager = new SyncCursorManager(cursorService);

    connections = new ConnectionManager({
      connections: connectionRepo,
      oauthStates: new InMemoryOAuthStateRepository(),
      providerAccounts: new InMemoryProviderAccountRepository(),
      tokenStorage: new ConnectSecureTokenStorage(),
      cursorManager,
    });

    eventStore = new ConnectEventStore(eventStoreRepo);
    const projections = new ProjectionEngine(eventStore, new InMemoryProjectionRepository());

    connect = createConnectPlatform({
      dispatcher,
      deadLetterQueue: dlq,
      logger,
      config,
      featureFlags: new FeatureFlagService(),
      registry: new ProviderRegistry(new FeatureFlagService(), logger),
      health: new HealthService(logger),
      validator,
      consumer: new MockEventConsumer(logger),
      eventStore,
      projectionEngine: projections,
      cursorManager,
    });

    metrics = new WebhookMetrics();
    const pipeline = new AtsEventPipeline(dispatcher, logger, validator);
    const processor = new GreenhouseWebhookProcessor({
      pipeline,
      connect,
      cursorManager,
      jobMap: new InMemoryJobMapRepository(),
      candidateMap: new InMemoryCandidateMapRepository(),
      deadLetterQueue: dlq,
      logger,
      metrics,
    });

    webhooks = new WebhookService({
      connections,
      webhooks: webhookRepo,
      processor,
      deadLetterQueue: dlq,
      logger,
      metrics,
    });
  });

  async function seedConnection(id = "conn-wh"): Promise<void> {
    await connectionRepo.create({
      id,
      employerAccountId: "employer-1",
      provider: "greenhouse",
      status: "connected",
      oauthScopes: ["harvest:read"],
      metadata: {},
    });
    await connections.completeConnection({
      connectionId: id,
      tokens: {
        accessToken: "token",
        refreshToken: "refresh",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ["harvest:read"],
      },
    });
    await connections.initializeCursor(id, "greenhouse");
  }

  afterEach(() => {
    connectionRepo.clear();
    eventStoreRepo.clear();
    webhookRepo.clear();
  });

  it("verifies Greenhouse webhook signatures", () => {
    const body = JSON.stringify(loadFixture("candidate-created.json"));
    const sig = signBody(body);
    expect(verifyGreenhouseWebhookSignature(body, sig, WEBHOOK_SECRET)).toBe(true);
    expect(verifyGreenhouseWebhookSignature(body, "sha256=invalid", WEBHOOK_SECRET)).toBe(false);
  });

  it("routes all supported Greenhouse webhook actions", () => {
    const actions = [
      "candidate_created",
      "candidate_updated",
      "application_created",
      "application_updated",
      "application_stage_changed",
      "job_updated",
      "offer_created",
      "offer_accepted",
      "offer_rejected",
      "hire_candidate",
      "reject_candidate",
      "candidate_withdrawn",
    ];
    for (const action of actions) {
      expect(routeGreenhouseWebhook(action)).not.toBeNull();
    }
  });

  it("accepts valid webhook and stores event", async () => {
    await seedConnection();
    const payload = loadFixture("candidate-created.json");
    const rawBody = JSON.stringify(payload);

    const result = await webhooks.receiveGreenhouse({
      rawBody,
      headers: { signature: signBody(rawBody), "x-workvouch-connection-id": "conn-wh" },
      webhookSecret: WEBHOOK_SECRET,
    });

    expect(result.status).toBe(200);
    expect(result.accepted).toBe(true);
    expect(result.processed).toBe(true);
    expect(eventStoreRepo.size()).toBeGreaterThan(0);

    const cursor = await connections.getCursor("conn-wh");
    expect(cursor?.lastWebhookProcessed).toBeDefined();
  });

  it("rejects invalid webhook signature with 401", async () => {
    await seedConnection();
    const rawBody = JSON.stringify(loadFixture("candidate-created.json"));

    const result = await webhooks.receiveGreenhouse({
      rawBody,
      headers: { signature: "sha256=bad", "x-workvouch-connection-id": "conn-wh" },
      webhookSecret: WEBHOOK_SECRET,
    });

    expect(result.status).toBe(401);
    expect(result.accepted).toBe(false);
  });

  it("detects duplicate webhook delivery", async () => {
    await seedConnection();
    const rawBody = JSON.stringify(loadFixture("candidate-created.json"));
    const headers = { signature: signBody(rawBody), "x-workvouch-connection-id": "conn-wh" };

    const first = await webhooks.receiveGreenhouse({ rawBody, headers, webhookSecret: WEBHOOK_SECRET });
    const second = await webhooks.receiveGreenhouse({ rawBody, headers, webhookSecret: WEBHOOK_SECRET });

    expect(first.processed).toBe(true);
    expect(second.duplicate).toBe(true);
    expect(second.processed).toBe(false);
    expect(metrics.getSnapshot().duplicates).toBeGreaterThan(0);
  });

  it("processes application stage changed webhook", async () => {
    await seedConnection();
    const payload = {
      action: "application_stage_changed",
      payload: {
        id: 999,
        candidate_id: 123,
        jobs: [{ id: 111, name: "Engineer" }],
        current_stage: { id: 1, name: "Phone Screen" },
        updated_at: "2026-08-08T12:00:00Z",
      },
    };
    const rawBody = JSON.stringify(payload);

    const result = await webhooks.receiveGreenhouse({
      rawBody,
      headers: { signature: signBody(rawBody), "x-workvouch-connection-id": "conn-wh" },
      webhookSecret: WEBHOOK_SECRET,
    });

    expect(result.processed).toBe(true);
  });

  it("sends failed validation to dead letter queue", async () => {
    await seedConnection();
    const rawBody = JSON.stringify({ action: "unknown_event", payload: { id: 1 } });

    const result = await webhooks.receiveGreenhouse({
      rawBody,
      headers: { signature: signBody(rawBody), "x-workvouch-connection-id": "conn-wh" },
      webhookSecret: WEBHOOK_SECRET,
    });

    expect(result.status).toBe(200);
    expect(result.processed).toBe(false);
    expect(dlq.size()).toBeGreaterThan(0);
  });

  it("Greenhouse provider receiveWebhook validates signature", async () => {
    const provider = createGreenhouseProvider();
    const rawBody = JSON.stringify(loadFixture("job-created.json"));

    const valid = await provider.receiveWebhook({
      connectionId: "conn-1",
      employerAccountId: "employer-1",
      rawBody,
      headers: { signature: signBody(rawBody) },
      webhookSecret: WEBHOOK_SECRET,
    });
    expect(valid.accepted).toBe(true);

    const invalid = await provider.receiveWebhook({
      connectionId: "conn-1",
      employerAccountId: "employer-1",
      rawBody,
      headers: { signature: "sha256=bad" },
      webhookSecret: WEBHOOK_SECRET,
    });
    expect(invalid.accepted).toBe(false);
  });

  it("tracks webhook metrics", async () => {
    await seedConnection();
    const rawBody = JSON.stringify(loadFixture("candidate-updated.json"));

    await webhooks.receiveGreenhouse({
      rawBody,
      headers: { signature: signBody(rawBody), "x-workvouch-connection-id": "conn-wh" },
      webhookSecret: WEBHOOK_SECRET,
    });

    const snapshot = webhooks.getMetrics();
    expect(snapshot.deliverySuccess).toBeGreaterThan(0);
    expect(snapshot.averageLatencyMs).toBeGreaterThanOrEqual(0);
  });
});
