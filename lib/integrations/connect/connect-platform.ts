import { createCorrelationId, nowIso } from "../utils/correlation";
import type { AtsProviderId } from "../types/common";
import type { IntegrationLogEntry } from "../types/logging";
import type { AtsEventEnvelope } from "../core/events/ats-event-types";
import type {
  ConnectEventFilter,
  ConnectEventRecord,
  CorrelationExploration,
  EventInspection,
  PayloadComparison,
  ReplayOptions,
  ReplayResult,
} from "./types";
import type { ConnectAggregateType } from "./persistence/types";
import { WORKVOUCH_CONNECT_NAME } from "./types";
import { EventHistoryStore } from "./history/event-history-store";
import { AuditService } from "./audit/audit-service";
import { TimelineGenerator } from "./timeline/timeline-generator";
import { EventInspectorService } from "./inspector/event-inspector-service";
import { ReplayService, type ReplayTranslator } from "./replay/replay-service";
import { ConnectDiagnosticsService } from "./diagnostics/connect-diagnostics-service";
import { CorrelationExplorerService } from "./correlation/correlation-explorer-service";
import type { EventDispatcher } from "../events/EventDispatcher";
import type { DeadLetterQueue } from "../queue/DeadLetterQueue";
import type { LoggingService } from "../logging/LoggingService";
import type { ConfigurationService, FeatureFlagService } from "../config";
import type { ProviderRegistry } from "../registry/ProviderRegistry";
import type { HealthService } from "../health/HealthService";
import type { EventValidator } from "../core/validation/event-validator";
import type { MockEventConsumer } from "../core/consumers/mock-event-consumer";
import type { ConnectEventStore } from "./event-store/connect-event-store";
import type { ProjectionEngine } from "./projection/projection-engine";
import { CONNECT_PLATFORM_VERSION } from "./version";
import { resolveAggregateFromTranslation } from "./utils/resolve-aggregate";

export interface ConnectPlatformDeps {
  dispatcher: EventDispatcher;
  deadLetterQueue: DeadLetterQueue;
  logger: LoggingService;
  config: ConfigurationService;
  featureFlags: FeatureFlagService;
  registry: ProviderRegistry;
  health: HealthService;
  validator: EventValidator;
  consumer: MockEventConsumer;
  translator?: ReplayTranslator;
  eventStore?: ConnectEventStore;
  projectionEngine?: ProjectionEngine;
  providerVersion?: string;
}

export interface RecordConnectEventInput {
  correlationId?: string;
  provider: AtsProviderId;
  rawPayload: unknown;
  employerAccountId: string;
  connectionId: string;
  providerEvent?: string;
  universalEvent?: string;
  providerPayload?: unknown;
  universalModel?: unknown;
  validation?: ConnectEventRecord["validation"];
  translation?: ConnectEventRecord["translation"];
  busEvent?: ConnectEventRecord["busEvent"];
  simulationOnly?: boolean;
  metadata?: Record<string, unknown>;
}

export interface TranslationCaptureInput extends RecordConnectEventInput {
  published: boolean;
  busEventId?: string;
}

/**
 * WorkVouch Connect — internal developer platform for inspection, replay,
 * diagnostics, and audit across all ATS providers.
 */
export class ConnectPlatform {
  readonly name = WORKVOUCH_CONNECT_NAME;

  readonly history: EventHistoryStore;
  readonly audit: AuditService;
  readonly timeline: TimelineGenerator;
  readonly inspector: EventInspectorService;
  readonly replay: ReplayService;
  readonly diagnostics: ConnectDiagnosticsService;
  readonly correlation: CorrelationExplorerService;
  readonly eventStore?: ConnectEventStore;
  readonly projectionEngine?: ProjectionEngine;
  private readonly persistQueue: Promise<void>[] = [];

  constructor(private readonly deps: ConnectPlatformDeps) {
    this.eventStore = deps.eventStore;
    this.projectionEngine = deps.projectionEngine;
    this.history = new EventHistoryStore();
    this.audit = new AuditService(this.history, deps.logger, deps.eventStore);
    this.timeline = new TimelineGenerator(this.history);
    this.inspector = new EventInspectorService(this.history, deps.dispatcher, deps.logger, this.timeline);
    this.replay = new ReplayService(
      this.history,
      this.audit,
      this.timeline,
      deps.dispatcher,
      deps.deadLetterQueue,
      deps.validator,
      deps.consumer,
      deps.logger,
      deps.translator,
      deps.eventStore,
      deps.projectionEngine
    );
    this.diagnostics = new ConnectDiagnosticsService(
      deps.config,
      deps.featureFlags,
      deps.registry,
      deps.health
    );
    this.correlation = new CorrelationExplorerService(
      this.history,
      this.inspector,
      this.timeline,
      this.replay,
      deps.logger
    );
  }

  /** Record a provider payload as it enters the connect pipeline. */
  recordReceived(input: RecordConnectEventInput): ConnectEventRecord {
    const correlationId = input.correlationId ?? createCorrelationId("connect");
    const record = this.history.create({
      correlationId,
      provider: input.provider,
      rawPayload: input.rawPayload,
      providerPayload: input.providerPayload ?? input.rawPayload,
      employerAccountId: input.employerAccountId,
      connectionId: input.connectionId,
      providerEvent: input.providerEvent,
      universalEvent: input.universalEvent,
      universalModel: input.universalModel,
      validation: input.validation,
      translation: input.translation,
      busEvent: input.busEvent,
      simulationOnly: input.simulationOnly ?? false,
      metadata: input.metadata,
    });
    this.audit.received(record.id, { correlationId, provider: input.provider });
    this.timeline.addStage(record.id, "received", { message: "Payload received" });
    return record;
  }

  /** Capture full translation result after mapper + validation + publish. */
  captureTranslation(input: TranslationCaptureInput): ConnectEventRecord {
    let record = input.correlationId
      ? this.history.listByCorrelation(input.correlationId)[0]
      : undefined;

    if (!record) {
      record = this.recordReceived(input);
    }

    this.history.update(record.id, {
      providerEvent: input.providerEvent,
      universalEvent: input.universalEvent,
      universalModel: input.universalModel,
      validation: input.validation,
      translation: input.translation,
      busEvent: input.busEvent,
    });

    if (input.validation) {
      this.audit.validated(record.id, input.validation.valid, { correlationId: record.correlationId });
      this.timeline.addStage(record.id, "validated", {
        message: input.validation.valid ? "Validation passed" : "Validation failed",
      });
    }

    if (input.translation) {
      this.audit.mapped(record.id, input.translation.mapperUsed, { correlationId: record.correlationId });
      this.timeline.addStage(record.id, "mapped", {
        durationMs: input.translation.durationMs,
        message: `Mapped via ${input.translation.mapperUsed}`,
      });
    }

    if (input.published && input.busEventId) {
      this.audit.published(record.id, input.busEventId, { correlationId: record.correlationId });
      this.timeline.addStage(record.id, "published", { message: "Published to event bus" });
      this.audit.succeeded(record.id);
      this.timeline.addStage(record.id, "completed", { message: "Pipeline completed" });
    } else if (!input.published) {
      this.audit.failed(record.id, "Translation not published", { correlationId: record.correlationId });
      this.timeline.addStage(record.id, "failed", { message: "Translation not published" });
    }

    const task = this.persistToEventStore(record, input);
    this.persistQueue.push(task);

    return this.history.get(record.id)!;
  }

  async flushPersistence(): Promise<void> {
    await Promise.all(this.persistQueue);
    this.persistQueue.length = 0;
  }

  private async persistToEventStore(
    record: ConnectEventRecord,
    input: TranslationCaptureInput
  ): Promise<void> {
    if (!this.eventStore || !input.universalEvent) return;

    const { aggregateType, aggregateId } = resolveAggregateFromTranslation({
      universalEvent: input.universalEvent,
      universalModel: input.universalModel,
      connectionId: input.connectionId,
    });

    const stored = await this.eventStore.appendEvent({
      correlationId: record.correlationId,
      provider: input.provider,
      providerVersion: this.deps.providerVersion ?? "1.0.0",
      connectVersion: CONNECT_PLATFORM_VERSION,
      companyId: input.employerAccountId,
      connectionId: input.connectionId,
      aggregateType,
      aggregateId,
      eventType: input.universalEvent,
      providerEventType: input.providerEvent,
      payload: {
        rawPayload: input.rawPayload,
        universalModel: input.universalModel,
        validation: input.validation,
        translation: input.translation,
      },
      metadata: { connectRecordId: record.id, published: input.published },
      idempotencyKey: input.providerEvent
        ? `${input.provider}:${input.providerEvent}:${aggregateId}:${input.universalEvent}`
        : undefined,
    });

    if (this.projectionEngine && input.published) {
      await this.projectionEngine.projectState(aggregateType, aggregateId, `${aggregateType}_current_state`);
    }

    this.history.update(record.id, {
      metadata: { ...record.metadata, storedEventId: stored.id, sequenceNumber: stored.sequenceNumber },
    });
  }

  captureConsumed(eventId: string, logEntry?: IntegrationLogEntry): void {
    this.audit.consumed(eventId);
    this.timeline.addStage(eventId, "consumed", { message: "Event consumed" });
    if (logEntry) {
      const record = this.history.get(eventId);
      if (record) {
        this.history.update(eventId, { logs: [...record.logs, logEntry] });
      }
    }
  }

  // Developer API surface (internal services only — no public routes)

  inspectEvent(eventId: string): EventInspection | undefined {
    return this.inspector.inspectEvent(eventId);
  }

  listEvents(filter?: ConnectEventFilter): ConnectEventRecord[] {
    return this.inspector.listEvents(filter);
  }

  getEvent(eventId: string): ConnectEventRecord | undefined {
    return this.inspector.getEvent(eventId);
  }

  replayEvent(eventId: string, options?: ReplayOptions): ReplayResult {
    return this.replay.replayEvent(eventId, options);
  }

  simulateReplay(eventId: string): ReplayResult {
    return this.replay.simulateReplay(eventId);
  }

  getTimeline(eventId: string) {
    return this.timeline.getTimelineWithDurations(eventId);
  }

  getAuditTrail(eventId: string) {
    return this.audit.getTrail(eventId);
  }

  exploreCorrelation(correlationId: string): CorrelationExploration {
    return this.correlation.explore(correlationId);
  }

  async loadPersistedTimeline(correlationId: string) {
    if (!this.eventStore) return [];
    return this.eventStore.loadTimeline({ correlationId });
  }

  async replayAggregate(aggregateType: ConnectAggregateType, aggregateId: string, dryRun = true) {
    if (!this.eventStore) throw new Error("Event store not configured");
    return this.eventStore.replayStream(aggregateType, aggregateId, { dryRun });
  }

  async projectState(aggregateType: ConnectAggregateType, aggregateId: string) {
    if (!this.projectionEngine) throw new Error("Projection engine not configured");
    return this.projectionEngine.projectState(aggregateType, aggregateId, `${aggregateType}_current_state`);
  }

  runDiagnostics() {
    return this.diagnostics.runDiagnostics();
  }

  validatePayload(rawPayload: unknown): { valid: boolean; message: string } {
    if (rawPayload === null || typeof rawPayload !== "object") {
      return { valid: false, message: "Payload must be an object" };
    }
    const payload = rawPayload as Record<string, unknown>;
    if (!payload.action || !payload.payload) {
      return { valid: false, message: "Webhook payload requires action and payload fields" };
    }
    return { valid: true, message: "Payload structure valid" };
  }

  comparePayloads(eventId: string, otherPayload: unknown): PayloadComparison {
    return this.replay.comparePayloads(eventId, otherPayload);
  }

  attachBusEvent(eventId: string, busEvent: ConnectEventRecord["busEvent"]): void {
    this.history.update(eventId, { busEvent });
    const envelope = busEvent?.payload as AtsEventEnvelope | undefined;
    if (envelope?.entity) {
      this.history.update(eventId, { universalModel: envelope.entity });
    }
  }

  reset(): void {
    this.history.clear();
    this.replay.clearHistory();
    this.deps.validator.reset();
  }

  get evaluatedAt(): string {
    return nowIso();
  }
}

export function createConnectPlatform(deps: ConnectPlatformDeps): ConnectPlatform {
  return new ConnectPlatform(deps);
}
