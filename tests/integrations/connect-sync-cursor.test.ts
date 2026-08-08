import { readFileSync } from "fs";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ConnectEventStore,
  ConnectHealthService,
  ConnectionManager,
  InMemoryCandidateMapRepository,
  InMemoryConnectionRepository,
  InMemoryEventStoreRepository,
  InMemoryJobMapRepository,
  InMemoryOAuthStateRepository,
  InMemoryProjectionRepository,
  InMemoryProviderAccountRepository,
  InMemorySyncCheckpointRepository,
  InMemorySyncCursorRepository,
  InMemorySyncLogRepository,
  ProjectionEngine,
  ReplayService,
  SyncCursorManager,
  SyncCursorService,
  SyncCursorValidator,
} from "@/lib/integrations";
import { EventHistoryStore } from "@/lib/integrations/connect/history/event-history-store";
import { AuditService } from "@/lib/integrations/connect/audit/audit-service";
import { TimelineGenerator } from "@/lib/integrations/connect/timeline/timeline-generator";
import { EventDispatcher } from "@/lib/integrations/events/EventDispatcher";
import { DeadLetterQueue } from "@/lib/integrations/queue/DeadLetterQueue";
import { StructuredLoggingService } from "@/lib/integrations/logging/LoggingService";
import { EventValidator } from "@/lib/integrations/core/validation/event-validator";
import { MockEventConsumer } from "@/lib/integrations/core/consumers/mock-event-consumer";
import { HarvestClient } from "@/lib/integrations/providers/greenhouse/api/harvest-client";
import { MockHttpClient } from "@/lib/integrations/providers/greenhouse/api/http-client";
import { HarvestImportService } from "@/lib/integrations/providers/greenhouse/sync/harvest-import-service";
import { resolveGreenhouseConfig } from "@/lib/integrations/providers/greenhouse/config/greenhouse-config";
import { ConnectSecureTokenStorage } from "@/lib/integrations/connect/auth/secure-token-storage";

const FIXTURE_DIR = join(process.cwd(), "lib/integrations/providers/greenhouse/fixtures/greenhouse");

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(FIXTURE_DIR, name), "utf8"));
}

describe("WorkVouch Connect — Sprint 6A Sync Cursor Engine", () => {
  let cursorService: SyncCursorService;
  let cursorManager: SyncCursorManager;
  let cursorRepo: InMemorySyncCursorRepository;
  let checkpointRepo: InMemorySyncCheckpointRepository;
  let connections: ConnectionManager;
  let connectionRepo: InMemoryConnectionRepository;
  let eventStore: ConnectEventStore;
  let eventStoreRepo: InMemoryEventStoreRepository;
  let harvestImport: HarvestImportService;
  let replay: ReplayService;
  let mockHttp: MockHttpClient;

  beforeEach(() => {
    process.env.ATS_ENABLED = "true";
    process.env.GREENHOUSE_ENABLED = "true";
    process.env.GREENHOUSE_CLIENT_ID = "gh-test";
    process.env.GREENHOUSE_CLIENT_SECRET = "gh-secret";

    cursorRepo = new InMemorySyncCursorRepository();
    checkpointRepo = new InMemorySyncCheckpointRepository();
    cursorService = new SyncCursorService(cursorRepo, checkpointRepo);
    cursorManager = new SyncCursorManager(cursorService);

    connectionRepo = new InMemoryConnectionRepository();
    eventStoreRepo = new InMemoryEventStoreRepository();

    connections = new ConnectionManager({
      connections: connectionRepo,
      oauthStates: new InMemoryOAuthStateRepository(),
      providerAccounts: new InMemoryProviderAccountRepository(),
      tokenStorage: new ConnectSecureTokenStorage(),
      cursorManager,
    });

    eventStore = new ConnectEventStore(eventStoreRepo);
    const projections = new ProjectionEngine(eventStore, new InMemoryProjectionRepository());

    mockHttp = new MockHttpClient();
    const jobs = [loadFixture("job-created.json")];
    mockHttp.on("/jobs", () => ({ status: 200, headers: {}, body: JSON.stringify(jobs) }));
    mockHttp.on("/candidates", () => ({
      status: 200,
      headers: {},
      body: JSON.stringify([loadFixture("candidate-created.json")]),
    }));
    mockHttp.on("/applications", () => ({ status: 200, headers: {}, body: JSON.stringify([]) }));
    mockHttp.on("/users", () => ({
      status: 200,
      headers: {},
      body: JSON.stringify([{ id: 1, name: "Test User", email: "test@greenhouse.io" }]),
    }));

    const harvest = new HarvestClient(resolveGreenhouseConfig(), mockHttp);
    harvestImport = new HarvestImportService({
      harvest,
      connections,
      eventStore,
      projections,
      jobMap: new InMemoryJobMapRepository(),
      candidateMap: new InMemoryCandidateMapRepository(),
      syncLog: new InMemorySyncLogRepository(),
      cursorManager,
    });

    const history = new EventHistoryStore();
    const logger = new StructuredLoggingService();
    replay = new ReplayService(
      history,
      new AuditService(history, logger, eventStore),
      new TimelineGenerator(history),
      new EventDispatcher(),
      new DeadLetterQueue(),
      new EventValidator(),
      new MockEventConsumer(),
      logger,
      undefined,
      eventStore,
      projections,
      cursorManager
    );
  });

  afterEach(() => {
    connectionRepo.clear();
    eventStoreRepo.clear();
    cursorRepo.clear();
    checkpointRepo.clear();
  });

  async function seedConnection(id = "conn-cursor"): Promise<void> {
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
        accessToken: "test-token",
        refreshToken: "refresh",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ["harvest:read"],
      },
    });
  }

  it("initializes cursor for a new connection", async () => {
    await seedConnection();
    const cursor = await connections.initializeCursor("conn-cursor", "greenhouse", "1.0.0");
    expect(cursor).not.toBeNull();
    expect(cursor?.connectionId).toBe("conn-cursor");
    expect(cursor?.status).toBe("idle");
    expect(cursor?.lastSequenceNumber).toBe(0);
  });

  it("advances cursor and creates checkpoint after successful import", async () => {
    await seedConnection();
    const result = await harvestImport.importAll({
      connectionId: "conn-cursor",
      employerAccountId: "employer-1",
      maxPages: 1,
      mode: "full",
    });

    expect(result.cursorAdvanced).toBe(true);
    const cursor = await connections.getCursor("conn-cursor");
    expect(cursor?.lastSuccessfulSync).toBeDefined();
    expect(cursor?.providerCursor.updatedAfter).toBeDefined();

    const checkpoints = await cursorService.checkpoints.listByConnection("conn-cursor");
    expect(checkpoints.length).toBe(1);
    expect(checkpoints[0].importedJobs).toBeGreaterThan(0);
  });

  it("uses incremental mode after first sync", async () => {
    await seedConnection();
    await harvestImport.importAll({
      connectionId: "conn-cursor",
      employerAccountId: "employer-1",
      maxPages: 1,
      mode: "full",
    });

    const mode = await connections.resolveSyncMode("conn-cursor");
    expect(mode).toBe("incremental");

    const incremental = await harvestImport.importIncremental({
      connectionId: "conn-cursor",
      employerAccountId: "employer-1",
      maxPages: 1,
    });
    expect(incremental.mode).toBe("incremental");
    expect(incremental.dryRun).toBe(false);
  });

  it("supports dry run without advancing cursor checkpoints", async () => {
    await seedConnection();
    await connections.initializeCursor("conn-cursor", "greenhouse");

    const before = await cursorService.checkpoints.listByConnection("conn-cursor");
    const result = await harvestImport.dryRunImport({
      connectionId: "conn-cursor",
      employerAccountId: "employer-1",
      maxPages: 1,
    });

    expect(result.dryRun).toBe(true);
    expect(result.cursorAdvanced).toBe(false);
    const after = await cursorService.checkpoints.listByConnection("conn-cursor");
    expect(after.length).toBe(before.length);
  });

  it("resets and clones cursors", async () => {
    await seedConnection();
    await harvestImport.importAll({
      connectionId: "conn-cursor",
      employerAccountId: "employer-1",
      maxPages: 1,
      mode: "full",
    });

    const reset = await connections.resetCursor("conn-cursor");
    expect(reset?.lastSequenceNumber).toBe(0);
    expect(reset?.lastSuccessfulSync).toBeUndefined();

    await connectionRepo.create({
      id: "conn-clone",
      employerAccountId: "employer-2",
      provider: "greenhouse",
      status: "connected",
      oauthScopes: ["harvest:read"],
      metadata: {},
    });
    const cloned = await cursorService.clone("conn-cursor", "conn-clone");
    expect(cloned.connectionId).toBe("conn-clone");
  });

  it("validates cursor health states", async () => {
    const validator = new SyncCursorValidator(24 * 60 * 60 * 1000);
    expect(validator.validate(null).status).toBe("missing");

    await seedConnection();
    const cursor = await connections.initializeCursor("conn-cursor", "greenhouse");
    expect(validator.validate(cursor!).status).toBe("healthy");
  });

  it("recovers from error state via recovery import", async () => {
    await seedConnection();
    await connections.initializeCursor("conn-cursor", "greenhouse");
    await cursorService.recordError("conn-cursor", "Simulated outage");

    const mode = await connections.resolveSyncMode("conn-cursor");
    expect(mode).toBe("recovery");

    const result = await harvestImport.recoveryImport({
      connectionId: "conn-cursor",
      employerAccountId: "employer-1",
      maxPages: 1,
    });
    expect(result.mode).toBe("recovery");
    expect(result.errors).toHaveLength(0);
  });

  it("reports cursor health in ConnectHealthService", async () => {
    await seedConnection();
    await harvestImport.importAll({
      connectionId: "conn-cursor",
      employerAccountId: "employer-1",
      maxPages: 1,
      mode: "full",
    });

    const health = new ConnectHealthService({
      connections,
      eventStore,
      projections: new ProjectionEngine(eventStore, new InMemoryProjectionRepository()),
      cursorManager,
      providerVersion: "1.0.0",
    });

    const report = await health.evaluate("conn-cursor");
    const cursorComponent = report.components.find((c) => c.name === "cursor");
    expect(cursorComponent).toBeDefined();
    expect(["healthy", "behind"]).toContain(cursorComponent?.status);
  });

  it("replays events from cursor sequence", async () => {
    await seedConnection();
    await harvestImport.importAll({
      connectionId: "conn-cursor",
      employerAccountId: "employer-1",
      maxPages: 1,
      mode: "full",
    });

    const cursor = await connections.getCursor("conn-cursor");
    const replayAll = await replay.replaySinceSequence("conn-cursor", 0);
    expect(replayAll.success).toBe(true);
    expect(replayAll.eventsReplayed).toBeGreaterThan(0);

    const sinceTs = await replay.replayUntilCursor("conn-cursor");
    expect(sinceTs.success).toBe(true);

    const fromCursor = await replay.replayFromCursor("conn-cursor");
    expect(fromCursor.eventsReplayed).toBeGreaterThanOrEqual(0);
    expect(cursor?.lastSequenceNumber).toBeGreaterThan(0);
  });

  it("computes performance metrics from checkpoints", async () => {
    await seedConnection();
    await harvestImport.importAll({
      connectionId: "conn-cursor",
      employerAccountId: "employer-1",
      maxPages: 1,
      mode: "full",
    });
    await harvestImport.importIncremental({
      connectionId: "conn-cursor",
      employerAccountId: "employer-1",
      maxPages: 1,
    });

    const metrics = await cursorManager.getPerformanceMetrics("conn-cursor");
    expect(metrics.sampleSize).toBeGreaterThan(0);
    expect(metrics.averageSyncDurationMs).toBeGreaterThan(0);
    expect(metrics.recordsPerMinute).toBeGreaterThan(0);
  });

  it("compares cursors for drift detection", async () => {
    await seedConnection();
    const left = (await connections.initializeCursor("conn-cursor", "greenhouse"))!;
    const right = { ...left, lastSequenceNumber: left.lastSequenceNumber + 5 };
    const comparison = new SyncCursorValidator().compare(left, right);
    expect(comparison.equal).toBe(false);
    expect(comparison.differences).toContain("lastSequenceNumber");
  });
});
