import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ConnectionManager,
  ConnectEventStore,
  ConnectSecureTokenStorage,
  InMemoryCandidateMapRepository,
  InMemoryConnectionRepository,
  InMemoryEventStoreRepository,
  InMemoryJobMapRepository,
  InMemoryOAuthStateRepository,
  InMemoryProjectionRepository,
  InMemoryProviderAccountRepository,
  InMemorySyncLogRepository,
  ProjectionEngine,
} from "@/lib/integrations";
import { HarvestClient } from "@/lib/integrations/providers/greenhouse/api/harvest-client";
import { MockHttpClient } from "@/lib/integrations/providers/greenhouse/api/http-client";
import { HarvestImportService } from "@/lib/integrations/providers/greenhouse/sync/harvest-import-service";
import { resolveGreenhouseConfig } from "@/lib/integrations/providers/greenhouse/config/greenhouse-config";

describe("Harvest import — candidate/application persistence", () => {
  let connections: ConnectionManager;
  let harvestImport: HarvestImportService;
  let candidateMap: InMemoryCandidateMapRepository;
  let eventStore: ConnectEventStore;
  let syncLog: InMemorySyncLogRepository;
  let mockHttp: MockHttpClient;

  beforeEach(async () => {
    const connectionRepo = new InMemoryConnectionRepository();
    candidateMap = new InMemoryCandidateMapRepository();
    const eventStoreRepo = new InMemoryEventStoreRepository();
    syncLog = new InMemorySyncLogRepository();

    connections = new ConnectionManager({
      connections: connectionRepo,
      oauthStates: new InMemoryOAuthStateRepository(),
      providerAccounts: new InMemoryProviderAccountRepository(),
      tokenStorage: new ConnectSecureTokenStorage(),
    });

    eventStore = new ConnectEventStore(eventStoreRepo);
    const projections = new ProjectionEngine(eventStore, new InMemoryProjectionRepository());

    mockHttp = new MockHttpClient();
    mockHttp.on("harvest.greenhouse.io/v3/jobs", () => ({
      status: 200,
      headers: { link: "" },
      body: JSON.stringify([]),
    }));
    mockHttp.on("candidates?ids=12345", () => ({
      status: 200,
      headers: { link: "" },
      body: JSON.stringify([
        {
          id: 12345,
          first_name: "Jon",
          last_name: "Jones",
          email_addresses: [{ value: "jon.jones@example.com", type: "personal" }],
          applications: [
            {
              id: 67890,
              candidate_id: 12345,
              jobs: [{ id: 111, name: "Sample Job 1" }],
              current_stage: { id: 222, name: "Reference Check" },
            },
          ],
          updated_at: "2026-08-07T20:00:00Z",
        },
      ]),
    }));
    mockHttp.on("harvest.greenhouse.io/v3/candidates", () => ({
      status: 200,
      headers: { link: "" },
      body: JSON.stringify([]),
    }));
    mockHttp.on("harvest.greenhouse.io/v3/applications", () => ({
      status: 200,
      headers: { link: "" },
      body: JSON.stringify([
        {
          id: 67890,
          candidate_id: 12345,
          jobs: [{ id: 111, name: "Sample Job 1" }],
          status: "active",
          current_stage: { id: 222, name: "Reference Check" },
          applied_at: "2026-08-07T20:00:00Z",
          updated_at: "2026-08-07T20:00:00Z",
        },
      ]),
    }));
    mockHttp.on("harvest.greenhouse.io/v3/candidate_employments", () => ({
      status: 200,
      headers: { link: "" },
      body: JSON.stringify([]),
    }));
    mockHttp.on("harvest.greenhouse.io/v3/custom_fields", () => ({
      status: 200,
      headers: { link: "" },
      body: JSON.stringify([]),
    }));

    const harvest = new HarvestClient(resolveGreenhouseConfig(), mockHttp);
    harvestImport = new HarvestImportService({
      harvest,
      connections,
      eventStore,
      projections,
      jobMap: new InMemoryJobMapRepository(),
      candidateMap,
      syncLog,
    });

    await connectionRepo.create({
      id: "conn-app-candidate",
      employerAccountId: "employer-1",
      provider: "greenhouse",
      status: "connected",
      oauthScopes: ["harvest:applications:list"],
      metadata: {},
    });
    await connections.completeConnection({
      connectionId: "conn-app-candidate",
      tokens: {
        accessToken: "test-token",
        refreshToken: "refresh",
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        scopes: ["harvest:applications:list"],
      },
    });
  });

  it("persists candidate from application when candidate list is empty", async () => {
    const result = await harvestImport.importFull({
      connectionId: "conn-app-candidate",
      employerAccountId: "employer-1",
      maxPages: 1,
    });

    expect(result.status).toBe("completed");
    expect(result.mode).toBe("full");
    expect(result.applicationsImported).toBe(1);
    expect(result.candidatesImported).toBe(1);
    expect(result.syncLogWritten).toBe(true);

    const candidates = await candidateMap.listByConnection("conn-app-candidate");
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.externalCandidateId).toBe("12345");
    expect(candidates[0]?.candidateName).toBe("Jon Jones");

    const timeline = await eventStore.loadTimeline({ connectionId: "conn-app-candidate", limit: 100 });
    const applicationEvents = timeline.filter((event) => event.aggregateType === "application");
    expect(applicationEvents).toHaveLength(1);
  });

  it("records failed sync history when tokens are missing", async () => {
    const result = await harvestImport.importFull({
      connectionId: "missing-connection",
      employerAccountId: "employer-1",
      maxPages: 1,
    });

    expect(result.status).toBe("failed");
    expect(result.syncLogWritten).toBe(true);
    expect(result.errors[0]).toMatch(/No tokens available/);

    const logs = await syncLog.listByConnection("missing-connection");
    expect(logs).toHaveLength(1);
    expect(logs[0]?.status).toBe("failed");
  });
});

describe("HarvestClient endpoint probes", () => {
  it("reports unhealthy when candidates probe fails", async () => {
    const mockHttp = new MockHttpClient();
    mockHttp.on("harvest.greenhouse.io/v3/jobs", () => ({
      status: 200,
      headers: { link: "" },
      body: JSON.stringify([]),
    }));
    mockHttp.on("harvest.greenhouse.io/v3/candidates", () => ({
      status: 403,
      headers: { link: "" },
      body: JSON.stringify({ message: "Forbidden" }),
    }));
    mockHttp.on("harvest.greenhouse.io/v3/applications", () => ({
      status: 200,
      headers: { link: "" },
      body: JSON.stringify([]),
    }));

    const harvest = new HarvestClient(resolveGreenhouseConfig(), mockHttp);
    const probe = await harvest.probeListEndpoints("token");

    expect(probe.healthy).toBe(false);
    expect(probe.endpoints).toHaveLength(3);
    expect(probe.endpoints.find((endpoint) => endpoint.path === "/candidates")?.healthy).toBe(false);
    expect(probe.endpoints.find((endpoint) => endpoint.path === "/jobs")?.healthy).toBe(true);
  });
});
