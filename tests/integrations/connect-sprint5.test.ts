import { readFileSync } from "fs";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ConfigurationService,
  ConnectHealthService,
  ConnectRecoveryService,
  ConnectionManager,
  ConnectEventStore,
  ConnectSecureTokenStorage,
  ConnectTokenStoreAdapter,
  ConnectOAuthStateAdapter,
  FeatureFlagService,
  InMemoryCandidateMapRepository,
  InMemoryConnectionRepository,
  InMemoryEventStoreRepository,
  InMemoryJobMapRepository,
  InMemoryOAuthStateRepository,
  InMemoryProjectionRepository,
  InMemoryProviderAccountRepository,
  InMemorySnapshotRepository,
  InMemorySyncLogRepository,
  ProjectionEngine,
  SnapshotService,
  StructuredLoggingService,
} from "@/lib/integrations";
import { HarvestClient } from "@/lib/integrations/providers/greenhouse/api/harvest-client";
import { MockHttpClient } from "@/lib/integrations/providers/greenhouse/api/http-client";
import { HarvestImportService } from "@/lib/integrations/providers/greenhouse/sync/harvest-import-service";
import { createGreenhouseProvider } from "@/lib/integrations/providers/greenhouse/provider";
import { resolveGreenhouseConfig } from "@/lib/integrations/providers/greenhouse/config/greenhouse-config";
import { generateCodeVerifier, generateOAuthState } from "@/lib/integrations/providers/greenhouse/auth/pkce";

const FIXTURE_DIR = join(process.cwd(), "lib/integrations/providers/greenhouse/fixtures/greenhouse");

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), "utf8"));
}

describe("WorkVouch Connect — Sprint 5 Live Connection", () => {
  let connections: ConnectionManager;
  let eventStore: ConnectEventStore;
  let projections: ProjectionEngine;
  let snapshots: SnapshotService;
  let harvest: HarvestClient;
  let harvestImport: HarvestImportService;
  let connectionRepo: InMemoryConnectionRepository;
  let eventStoreRepo: InMemoryEventStoreRepository;
  let oauthStateRepo: InMemoryOAuthStateRepository;
  let mockHttp: MockHttpClient;
  let logger: StructuredLoggingService;

  beforeEach(() => {
    process.env.ATS_ENABLED = "true";
    process.env.GREENHOUSE_ENABLED = "true";
    process.env.GREENHOUSE_CLIENT_ID = "gh-test";
    process.env.GREENHOUSE_CLIENT_SECRET = "gh-secret";

    connectionRepo = new InMemoryConnectionRepository();
    eventStoreRepo = new InMemoryEventStoreRepository();
    oauthStateRepo = new InMemoryOAuthStateRepository();
    logger = new StructuredLoggingService();

    connections = new ConnectionManager({
      connections: connectionRepo,
      oauthStates: oauthStateRepo,
      providerAccounts: new InMemoryProviderAccountRepository(),
      tokenStorage: new ConnectSecureTokenStorage(),
    });

    eventStore = new ConnectEventStore(eventStoreRepo);
    projections = new ProjectionEngine(eventStore, new InMemoryProjectionRepository());
    snapshots = new SnapshotService(eventStore, new InMemorySnapshotRepository(), projections);

    mockHttp = new MockHttpClient();
    mockHttp.on("harvest.greenhouse.io/v3/jobs", () => ({
      status: 200,
      headers: { link: "" },
      body: JSON.stringify([loadFixture("job-created.json")]),
    }));

    mockHttp.on("harvest.greenhouse.io/v3/candidates", () => ({
      status: 200,
      headers: { link: "" },
      body: JSON.stringify([loadFixture("candidate-created.json")]),
    }));

    mockHttp.on("harvest.greenhouse.io/v3/applications", () => ({
      status: 200,
      headers: { link: "" },
      body: JSON.stringify([]),
    }));

    mockHttp.on("harvest.greenhouse.io/v3/candidate_employments", () => ({
      status: 200,
      headers: { link: "" },
      body: JSON.stringify([]),
    }));

    mockHttp.on("harvest.greenhouse.io/v3/custom_fields", () => ({
      status: 200,
      headers: { link: "" },
      body: JSON.stringify([{ id: 1, name: "WorkVouch Trust Score", field_type: "number" }]),
    }));

    harvest = new HarvestClient(resolveGreenhouseConfig(), mockHttp);
    harvestImport = new HarvestImportService({
      harvest,
      connections,
      eventStore,
      projections,
      jobMap: new InMemoryJobMapRepository(),
      candidateMap: new InMemoryCandidateMapRepository(),
      syncLog: new InMemorySyncLogRepository(),
    });
  });

  afterEach(() => {
    connectionRepo.clear();
    eventStoreRepo.clear();
    oauthStateRepo.clear();
  });

  it("persists encrypted OAuth tokens via ConnectionManager", async () => {
    const conn = await connections.startOAuth({
      employerAccountId: "employer-1",
      provider: "greenhouse",
      redirectUri: "https://callback",
      requiredScopes: ["harvest:read"],
      codeVerifier: generateCodeVerifier(),
      state: generateOAuthState(),
    });

    await connections.completeConnection({
      connectionId: conn.connectionId,
      tokens: {
        accessToken: "access-plain",
        refreshToken: "refresh-plain",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ["harvest:read"],
      },
      providerAccountId: "1",
      providerAccountName: "Test User",
    });

    const tokens = await connections.getTokens(conn.connectionId);
    expect(tokens?.accessToken).toBe("access-plain");

    const row = await connectionRepo.getById(conn.connectionId);
    expect(row?.accessTokenEncrypted).not.toBe("access-plain");
    expect(row?.status).toBe("connected");
  });

  it("starts OAuth with persistent connection id", async () => {
    const state = generateOAuthState();
    const codeVerifier = generateCodeVerifier();
    const result = await connections.startOAuth({
      employerAccountId: "employer-1",
      provider: "greenhouse",
      redirectUri: "https://app.workvouch.com/callback",
      requiredScopes: ["harvest:read"],
      codeVerifier,
      state,
    });

    expect(result.connectionId).toBeDefined();
    const row = await connectionRepo.getById(result.connectionId);
    expect(row?.status).toBe("pending");
  });

  it("imports jobs and candidates into event store", async () => {
    await connectionRepo.create({
      id: "conn-import",
      employerAccountId: "employer-1",
      provider: "greenhouse",
      status: "connected",
      oauthScopes: ["harvest:read"],
      metadata: {},
    });
    await connections.completeConnection({
      connectionId: "conn-import",
      tokens: {
        accessToken: "test-token",
        refreshToken: "refresh",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ["harvest:read"],
      },
    });

    const result = await harvestImport.importAll({
      connectionId: "conn-import",
      employerAccountId: "employer-1",
      maxPages: 1,
    });

    expect(result.jobsImported).toBeGreaterThan(0);
    expect(result.candidatesImported).toBeGreaterThan(0);
    expect(result.eventsStored).toBeGreaterThan(0);
    expect(eventStoreRepo.size()).toBeGreaterThan(0);
  });

  it("creates snapshots every N events", async () => {
    for (let i = 1; i <= 50; i += 1) {
      await eventStore.appendEvent({
        correlationId: `snap-${i}`,
        provider: "greenhouse",
        providerVersion: "1.0.0",
        connectVersion: "1.0.0",
        companyId: "employer-1",
        connectionId: "conn-1",
        aggregateType: "candidate",
        aggregateId: "cand-1",
        eventType: "ats.candidate.updated",
        payload: { step: i },
      });
    }

    const snapshot = await snapshots.maybeCreateAutomaticSnapshot("candidate", "cand-1");
    expect(snapshot).not.toBeNull();
    expect(snapshot?.eventCount).toBe(50);
  });

  it("reports health for a connected employer", async () => {
    await connections.completeConnection({
      connectionId: (
        await connections.startOAuth({
          employerAccountId: "employer-1",
          provider: "greenhouse",
          redirectUri: "https://app.workvouch.com/callback",
          requiredScopes: ["harvest:read"],
          codeVerifier: generateCodeVerifier(),
          state: generateOAuthState(),
        })
      ).connectionId,
      tokens: {
        accessToken: "test-token",
        refreshToken: "refresh",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ["harvest:read"],
      },
    });

    const connectionId = (await connectionRepo.listByEmployer("employer-1"))[0].id;
    const health = new ConnectHealthService({
      connections,
      eventStore,
      projections,
      snapshots,
      testHarvest: async () => ({ healthy: true, latencyMs: 42 }),
    });

    const report = await health.evaluate(connectionId);
    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.components.some((c) => c.name === "oauth")).toBe(true);
    expect(report.components.some((c) => c.name === "harvest")).toBe(true);
  });

  it("recovers from token refresh via ConnectRecoveryService", async () => {
    const conn = await connections.startOAuth({
      employerAccountId: "employer-1",
      provider: "greenhouse",
      redirectUri: "https://callback",
      requiredScopes: ["harvest:read"],
      codeVerifier: generateCodeVerifier(),
      state: generateOAuthState(),
    });

    await connections.completeConnection({
      connectionId: conn.connectionId,
      tokens: {
        accessToken: "old-token",
        refreshToken: "refresh-token",
        expiresAt: new Date(Date.now() - 1000).toISOString(),
        scopes: ["harvest:read"],
      },
    });

    const recovery = new ConnectRecoveryService(connections, logger, async () => ({
      accessToken: "new-token",
      refreshToken: "new-refresh",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      scopes: ["harvest:read"],
    }));

    const result = await recovery.ensureValidToken(conn.connectionId);
    expect(result.refreshed).toBe(true);
    expect(result.accessToken).toBe("new-token");
  });

  it("validates OAuth scopes", () => {
    const result = connections.validateScopes(["harvest:read"], ["harvest:read", "harvest:write"]);
    expect(result.valid).toBe(false);
    expect(result.missing).toContain("harvest:write");
  });

  it("wires Greenhouse provider with persistent token store", async () => {
    const tokenStore = new ConnectTokenStoreAdapter(connections);
    const stateStore = new ConnectOAuthStateAdapter({ oauthStates: oauthStateRepo, provider: "greenhouse" });
    const provider = createGreenhouseProvider({
      http: mockHttp,
      tokenStore,
      stateStore,
      harvest,
      connectionManager: connections,
    });

    const pending = await provider.connect({
      employerAccountId: "employer-1",
      redirectUri: "https://callback",
      state: generateOAuthState(),
    });

    expect(pending.authorizationUrl).toContain("greenhouse.io");
    expect(pending.connectionId).toBeDefined();
  });
});
