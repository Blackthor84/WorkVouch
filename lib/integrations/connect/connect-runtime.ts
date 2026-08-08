import type { SupabaseClient } from "@supabase/supabase-js";
import type { LoggingService } from "../logging/LoggingService";
import { ConnectEventStore } from "./event-store/connect-event-store";
import { SnapshotService } from "./event-store/snapshot-service";
import { ConnectionManager } from "./connection/connection-manager";
import { ConnectHealthService } from "./health/connect-health-service";
import { ConnectRecoveryService } from "./recovery/connect-recovery-service";
import { ProjectionEngine } from "./projection/projection-engine";
import { ConnectPlatform, createConnectPlatform } from "./connect-platform";
import {
  InMemoryCandidateMapRepository,
  InMemoryConnectionRepository,
  InMemoryEventStoreRepository,
  InMemoryJobMapRepository,
  InMemoryOAuthStateRepository,
  InMemoryProjectionRepository,
  InMemoryProviderAccountRepository,
  InMemorySnapshotRepository,
  InMemorySyncCheckpointRepository,
  InMemorySyncCursorRepository,
  InMemorySyncLogRepository,
  InMemoryWebhookRepository,
  SupabaseCandidateMapRepository,
  SupabaseConnectionRepository,
  SupabaseEventStoreRepository,
  SupabaseJobMapRepository,
  SupabaseOAuthStateRepository,
  SupabaseProjectionRepository,
  SupabaseProviderAccountRepository,
  SupabaseSnapshotRepository,
  SupabaseSyncCheckpointRepository,
  SupabaseSyncCursorRepository,
  SupabaseSyncLogRepository,
  SupabaseWebhookRepository,
} from "./persistence";
import { SyncCursorService } from "./sync/sync-cursor-service";
import { SyncCursorManager } from "./sync/sync-cursor-manager";
import { WebhookMetrics } from "./webhooks/webhook-metrics";
import { GreenhouseWebhookProcessor } from "./webhooks/greenhouse-webhook-processor";
import { WebhookService } from "./webhooks/webhook-service";
import { AtsEventPipeline } from "../core/pipeline/ats-event-pipeline";
import type { EventDispatcher } from "../events/EventDispatcher";
import type { DeadLetterQueue } from "../queue/DeadLetterQueue";
import type { ConfigurationService, FeatureFlagService } from "../config";
import type { ProviderRegistry } from "../registry/ProviderRegistry";
import type { HealthService } from "../health/HealthService";
import type { EventValidator } from "../core/validation/event-validator";
import type { MockEventConsumer } from "../core/consumers/mock-event-consumer";
import { ConnectTokenStoreAdapter } from "./auth/connect-token-store-adapter";
import { HarvestImportService } from "../providers/greenhouse/sync/harvest-import-service";
import { createGreenhouseProvider } from "../providers/greenhouse/provider";
import { HarvestClient } from "../providers/greenhouse/api/harvest-client";
import { FetchHttpClient } from "../providers/greenhouse/api/http-client";
import { resolveGreenhouseConfig } from "../providers/greenhouse/config/greenhouse-config";
import { InMemoryOAuthStateStore } from "../providers/greenhouse/auth/oauth-state-store";
import { ConnectOAuthStateAdapter } from "./auth/connect-oauth-state-adapter";

export interface ConnectRuntimeDeps {
  supabase?: SupabaseClient;
  dispatcher: EventDispatcher;
  deadLetterQueue: DeadLetterQueue;
  logger: LoggingService;
  config: ConfigurationService;
  featureFlags: FeatureFlagService;
  registry: ProviderRegistry;
  health: HealthService;
  validator: EventValidator;
  consumer: MockEventConsumer;
}

export interface ConnectRuntime {
  connections: ConnectionManager;
  eventStore: ConnectEventStore;
  projections: ProjectionEngine;
  snapshots: SnapshotService;
  health: ConnectHealthService;
  recovery: ConnectRecoveryService;
  connect: ConnectPlatform;
  harvestImport: HarvestImportService;
  cursorManager: SyncCursorManager;
  webhooks: WebhookService;
  webhookMetrics: WebhookMetrics;
  oauthStateAdapter: ConnectOAuthStateAdapter;
}

function useSupabase(client?: SupabaseClient) {
  if (!client) {
    return {
      connections: new InMemoryConnectionRepository(),
      eventStore: new InMemoryEventStoreRepository(),
      projections: new InMemoryProjectionRepository(),
      oauthStates: new InMemoryOAuthStateRepository(),
      jobMap: new InMemoryJobMapRepository(),
      candidateMap: new InMemoryCandidateMapRepository(),
      providerAccounts: new InMemoryProviderAccountRepository(),
      syncLog: new InMemorySyncLogRepository(),
      snapshots: new InMemorySnapshotRepository(),
      syncCursor: new InMemorySyncCursorRepository(),
      syncCheckpoint: new InMemorySyncCheckpointRepository(),
      webhooks: new InMemoryWebhookRepository(),
    };
  }

  return {
    connections: new SupabaseConnectionRepository(client),
    eventStore: new SupabaseEventStoreRepository(client),
    projections: new SupabaseProjectionRepository(client),
    oauthStates: new SupabaseOAuthStateRepository(client),
    jobMap: new SupabaseJobMapRepository(client),
    candidateMap: new SupabaseCandidateMapRepository(client),
    providerAccounts: new SupabaseProviderAccountRepository(client),
    syncLog: new SupabaseSyncLogRepository(client),
    snapshots: new SupabaseSnapshotRepository(client),
    syncCursor: new SupabaseSyncCursorRepository(client),
    syncCheckpoint: new SupabaseSyncCheckpointRepository(client),
    webhooks: new SupabaseWebhookRepository(client),
  };
}

/** Production-ready Connect runtime wiring — provider agnostic core, Greenhouse import included. */
export function createConnectRuntime(deps: ConnectRuntimeDeps): ConnectRuntime {
  const repos = useSupabase(deps.supabase);

  const cursorService = new SyncCursorService(repos.syncCursor, repos.syncCheckpoint);
  const cursorManager = new SyncCursorManager(cursorService);

  const connections = new ConnectionManager({
    connections: repos.connections,
    oauthStates: repos.oauthStates,
    providerAccounts: repos.providerAccounts,
    cursorManager,
  });

  const eventStore = new ConnectEventStore(repos.eventStore);
  const projections = new ProjectionEngine(eventStore, repos.projections);
  const snapshots = new SnapshotService(eventStore, repos.snapshots, projections);
  const tokenStore = new ConnectTokenStoreAdapter(connections);

  const oauthStateAdapter = new ConnectOAuthStateAdapter({
    oauthStates: repos.oauthStates,
    provider: "greenhouse",
  });

  const ghConfig = resolveGreenhouseConfig();
  const harvest = new HarvestClient(ghConfig, new FetchHttpClient());

  const recovery = new ConnectRecoveryService(connections, deps.logger, async (refreshToken, connectionId) => {
    const provider = createGreenhouseProvider({ tokenStore, stateStore: oauthStateAdapter });
    const result = await provider.refreshToken({ refreshToken, connectionId, employerAccountId: "" });
    return result;
  });

  const harvestImport = new HarvestImportService({
    harvest,
    connections,
    eventStore,
    projections,
    jobMap: repos.jobMap,
    candidateMap: repos.candidateMap,
    syncLog: repos.syncLog,
    cursorManager,
  });

  const connect = createConnectPlatform({
    dispatcher: deps.dispatcher,
    deadLetterQueue: deps.deadLetterQueue,
    logger: deps.logger,
    config: deps.config,
    featureFlags: deps.featureFlags,
    registry: deps.registry,
    health: deps.health,
    validator: deps.validator,
    consumer: deps.consumer,
    eventStore,
    projectionEngine: projections,
    providerVersion: "1.0.0",
    cursorManager,
  });

  const health = new ConnectHealthService({
    connections,
    eventStore,
    projections,
    snapshots,
    providerVersion: "1.0.0",
    cursorManager,
    testHarvest: async (accessToken) => {
      const result = await harvest.healthCheck(accessToken);
      return { healthy: result.healthy, latencyMs: result.latencyMs, error: result.error };
    },
  });

  const pipeline = new AtsEventPipeline(deps.dispatcher, deps.logger, deps.validator);
  const webhookMetrics = new WebhookMetrics();
  const webhookProcessor = new GreenhouseWebhookProcessor({
    pipeline,
    connect,
    cursorManager,
    jobMap: repos.jobMap,
    candidateMap: repos.candidateMap,
    deadLetterQueue: deps.deadLetterQueue,
    logger: deps.logger,
    metrics: webhookMetrics,
  });

  const webhooks = new WebhookService({
    connections,
    webhooks: repos.webhooks,
    processor: webhookProcessor,
    deadLetterQueue: deps.deadLetterQueue,
    logger: deps.logger,
    metrics: webhookMetrics,
  });

  return {
    connections,
    eventStore,
    projections,
    snapshots,
    health,
    recovery,
    connect,
    harvestImport,
    cursorManager,
    webhooks,
    webhookMetrics,
    oauthStateAdapter,
  };
}

export { ConnectOAuthStateAdapter, InMemoryOAuthStateStore };
