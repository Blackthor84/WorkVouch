import { createHmac } from "crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ConfigurationService,
  FeatureFlagService,
  IntegrationManager,
  MockAtsProvider,
  ProviderLoader,
  ProviderRegistry,
  StructuredLoggingService,
  resetIntegrationManager,
  resetMockAtsProviderState,
} from "@/lib/integrations";
import { DeadLetterQueue } from "@/lib/integrations/queue/DeadLetterQueue";
import { RetryService } from "@/lib/integrations/queue/RetryService";
import { EventDispatcher } from "@/lib/integrations/events/EventDispatcher";
import { HealthService } from "@/lib/integrations/health/HealthService";
import { createMockAtsRegistration } from "@/lib/integrations/providers/mock/MockAtsProvider";
import { MOCK_WEBHOOK_SECRET } from "@/lib/integrations/providers/mock/mock-data";

function enableAtsFlags() {
  process.env.ATS_ENABLED = "true";
  process.env.MOCK_ATS_ENABLED = "true";
}

describe("WorkVouch Connect — Sprint 3A platform foundation", () => {
  beforeEach(() => {
    enableAtsFlags();
    resetMockAtsProviderState();
    resetIntegrationManager();
  });

  afterEach(() => {
    delete process.env.ATS_ENABLED;
    delete process.env.MOCK_ATS_ENABLED;
    vi.restoreAllMocks();
  });

  it("registers MockATS via ProviderLoader", () => {
    const logger = new StructuredLoggingService();
    const featureFlags = new FeatureFlagService();
    const registry = new ProviderRegistry(featureFlags, logger);
    const loader = new ProviderLoader(registry);

    loader.loadBuiltInProviders();

    expect(registry.isRegistered("mock")).toBe(true);
    const providers = registry.listProviders();
    expect(providers.some((p) => p.providerId === "mock")).toBe(true);
  });

  it("validates provider through registry and feature flags", () => {
    const manager = new IntegrationManager();
    const provider = manager.getProvider("mock");
    expect(provider.displayName).toBe("MockATS");
    expect(provider.getCapabilities().supportsOAuth).toBe(true);
  });

  it("blocks providers when ATS_ENABLED is false", () => {
    process.env.ATS_ENABLED = "false";
    const manager = new IntegrationManager();
    expect(() => manager.getProvider("mock")).toThrow(/disabled/i);
  });

  it("reads configuration from ConfigurationService", () => {
    process.env.MOCK_CLIENT_ID = "mock-client";
    process.env.MOCK_CLIENT_SECRET = "mock-secret";
    const config = new ConfigurationService();
    const providerConfig = config.getProviderConfiguration("mock");
    expect(providerConfig?.clientId).toBe("mock-client");
    expect(providerConfig?.clientSecret).toBe("mock-secret");
    delete process.env.MOCK_CLIENT_ID;
    delete process.env.MOCK_CLIENT_SECRET;
  });

  it("writes structured logs with required fields", () => {
    const logger = new StructuredLoggingService();
    logger.info("Test event", {
      provider: "mock",
      correlationId: "corr-123",
      companyId: "company-1",
      event: "test.event",
    });

    const entries = logger.getEntries(1);
    expect(entries).toHaveLength(1);
    expect(entries[0].timestamp).toBeTruthy();
    expect(entries[0].provider).toBe("mock");
    expect(entries[0].correlationId).toBe("corr-123");
    expect(entries[0].companyId).toBe("company-1");
    expect(entries[0].event).toBe("test.event");
  });

  it("runs MockATS OAuth connect flow without external dependencies", async () => {
    const manager = new IntegrationManager();
    const pending = await manager.connect("mock", {
      employerAccountId: "employer-1",
      redirectUri: "https://workvouch.test/callback",
      state: "state-123",
    });

    expect(pending.status).toBe("pending");
    expect(pending.authorizationUrl).toContain("mock-ats.test");

    const connected = await manager.connect("mock", {
      employerAccountId: "employer-1",
      redirectUri: "https://workvouch.test/callback",
      state: "state-123",
      code: "auth-code",
    });

    expect(connected.status).toBe("connected");
    expect(connected.connectionId).toBeTruthy();
  });

  it("syncs mock candidate, job, and application", async () => {
    const provider = new MockAtsProvider();
    const candidate = await provider.syncCandidate({
      connectionId: "conn-1",
      accessToken: "token",
      externalCandidateId: "mock-candidate-1",
      direction: "inbound",
    });
    expect(candidate.success).toBe(true);

    const job = await provider.syncJob({
      connectionId: "conn-1",
      accessToken: "token",
      externalJobId: "mock-job-1",
      direction: "inbound",
    });
    expect(job.success).toBe(true);

    const application = await provider.syncApplication({
      connectionId: "conn-1",
      accessToken: "token",
      externalApplicationId: "mock-app-1",
      direction: "inbound",
    });
    expect(application.success).toBe(true);
  });

  it("validates and receives mock webhooks", async () => {
    const provider = new MockAtsProvider();
    const body = JSON.stringify({
      eventId: "evt-1",
      eventType: "candidate.created",
      candidateId: "mock-candidate-1",
    });
    const signature = createHmac("sha256", MOCK_WEBHOOK_SECRET).update(body).digest("hex");

    const result = await provider.receiveWebhook({
      connectionId: "conn-1",
      employerAccountId: "employer-1",
      rawBody: body,
      headers: { "x-mock-signature": signature },
      webhookSecret: MOCK_WEBHOOK_SECRET,
    });

    expect(result.accepted).toBe(true);
    expect(result.event?.eventType).toBe("candidate.created");
  });

  it("evaluates health states through HealthService", async () => {
    const logger = new StructuredLoggingService();
    const health = new HealthService(logger);
    const provider = new MockAtsProvider();

    const disconnected = await health.evaluate({ provider });
    expect(disconnected.state).toBe("disconnected");

    const connected = await managerConnectAndToken();
    const healthy = await health.evaluate({
      provider,
      connectionId: connected.connectionId,
      accessToken: connected.accessToken,
      employerAccountId: "employer-1",
    });
    expect(healthy.state).toBe("healthy");
  });

  it("publishes, processes, retries, and dead-letters events", async () => {
    vi.useFakeTimers();
    const logger = new StructuredLoggingService();
    const config = new ConfigurationService({
      defaultEventMaxAttempts: 2,
      defaultRetryBackoffMs: [10, 20],
    });
    const retry = new RetryService(config);
    const dlq = new DeadLetterQueue(logger);
    const events = new EventDispatcher(logger, config, retry, dlq);

    let attempts = 0;
    events.subscribe("test.retry", async () => {
      attempts += 1;
      throw new Error("temporary failure");
    });

    const event = events.publish({
      type: "test.retry",
      provider: "mock",
      payload: { ok: true },
    });

    await vi.runAllTimersAsync();
    expect(attempts).toBeGreaterThanOrEqual(2);
    expect(dlq.size()).toBe(1);
    expect(events.getEvent(event.id)?.status).toBe("dead_letter");
    vi.useRealTimers();
  });

  it("supports manual provider registration", () => {
    const logger = new StructuredLoggingService();
    const featureFlags = new FeatureFlagService();
    const registry = new ProviderRegistry(featureFlags, logger);
    const loader = new ProviderLoader(registry);

    loader.registerExternalProvider(createMockAtsRegistration());
    expect(registry.isRegistered("mock")).toBe(true);
  });
});

async function managerConnectAndToken(): Promise<{
  connectionId: string;
  accessToken: string;
}> {
  const manager = new IntegrationManager();
  const connected = await manager.connect("mock", {
    employerAccountId: "employer-1",
    redirectUri: "https://workvouch.test/callback",
    state: "state-123",
    code: "auth-code",
  });

  const provider = manager.getProvider("mock");
  const tokens = await provider.refreshToken({
    connectionId: connected.connectionId,
    refreshToken: `mock_refresh_${connected.connectionId}`,
  });

  return {
    connectionId: connected.connectionId,
    accessToken: tokens.accessToken,
  };
}
