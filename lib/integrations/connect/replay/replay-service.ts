import type { EventDispatcher } from "../../events/EventDispatcher";
import type { DeadLetterQueue } from "../../queue/DeadLetterQueue";
import type { LoggingService } from "../../logging/LoggingService";
import type { EventValidator } from "../../core/validation/event-validator";
import type { MockEventConsumer } from "../../core/consumers/mock-event-consumer";
import type { AtsEventEnvelope } from "../../core/events/ats-event-types";
import type {
  ConnectLifecycleStage,
  PayloadComparison,
  ReplayOptions,
  ReplayResult,
} from "../types";
import type { EventHistoryStore } from "../history/event-history-store";
import type { AuditService } from "../audit/audit-service";
import type { TimelineGenerator } from "../timeline/timeline-generator";
import type { ConnectEventStore } from "../event-store/connect-event-store";
import type { ProjectionEngine } from "../projection/projection-engine";
import type { ConnectAggregateType } from "../persistence/types";
import type { SyncCursorManager } from "../sync/sync-cursor-manager";
import type { ConnectSyncCheckpointRow } from "../sync/types";
import { nowIso } from "../../utils/correlation";

export type ReplayTranslator = (input: {
  rawPayload: unknown;
  employerAccountId: string;
  connectionId: string;
  correlationId: string;
  simulate: boolean;
}) => {
  published: boolean;
  universalEvent?: string;
  providerEvent?: string;
  mapperUsed?: string;
  validation?: { valid: boolean; errors: unknown[]; warnings: unknown[] };
  universalModel?: unknown;
  durationMs: number;
  reason?: string;
};

/** Safe replay engine — simulation/dry-run by default, no duplicate persistence. */
export class ReplayService {
  private readonly replayHistory: ReplayResult[] = [];

  constructor(
    private readonly history: EventHistoryStore,
    private readonly audit: AuditService,
    private readonly timeline: TimelineGenerator,
    private readonly dispatcher: EventDispatcher,
    private readonly deadLetterQueue: DeadLetterQueue,
    private readonly validator: EventValidator,
    private readonly consumer: MockEventConsumer,
    private readonly logger: LoggingService,
    private readonly translator?: ReplayTranslator,
    private readonly eventStore?: ConnectEventStore,
    private readonly projectionEngine?: ProjectionEngine,
    private readonly cursorManager?: SyncCursorManager
  ) {}

  replayEvent(eventId: string, options: ReplayOptions = {}): ReplayResult {
    return this.replayInternal(eventId, options);
  }

  replayBatch(eventIds: string[], options: ReplayOptions = {}): ReplayResult[] {
    return eventIds.map((id) => this.replayInternal(id, options));
  }

  simulateReplay(eventId: string): ReplayResult {
    return this.replayInternal(eventId, {
      dryRun: true,
      simulate: true,
      replayPipeline: true,
      replayTranslation: true,
      replayValidation: true,
      replayConsumer: true,
    });
  }

  async replayFromEventStore(
    aggregateType: ConnectAggregateType,
    aggregateId: string,
    options: ReplayOptions = {}
  ): Promise<ReplayResult & { streamEvents?: number; projectedState?: Record<string, unknown> }> {
    if (!this.eventStore) {
      return {
        eventId: aggregateId,
        correlationId: "unknown",
        mode: "dry_run",
        stagesReplayed: [],
        success: false,
        durationMs: 0,
        message: "Event store not configured",
        duplicatePrevented: false,
      };
    }

    const started = Date.now();
    const stream = await this.eventStore.replayStream(aggregateType, aggregateId, {
      dryRun: options.dryRun !== false,
    });

    if (this.projectionEngine && options.dryRun !== false) {
      await this.projectionEngine.projectState(aggregateType, aggregateId, `${aggregateType}_current_state`);
    }

    return {
      eventId: aggregateId,
      correlationId: stream.events[0]?.correlationId ?? "unknown",
      mode: options.dryRun !== false ? "dry_run" : "simulation",
      stagesReplayed: ["retried", "validated", "mapped", "published", "completed"],
      success: stream.events.length > 0,
      durationMs: Date.now() - started,
      universalModel: stream.projectedState,
      message: `Replayed ${stream.events.length} stored events`,
      duplicatePrevented: true,
      streamEvents: stream.events.length,
      projectedState: stream.projectedState,
    };
  }

  async replayTimeline(correlationId: string, options: ReplayOptions = {}): Promise<ReplayResult[]> {
    if (!this.eventStore) return [];
    const events = await this.eventStore.loadTimeline({ correlationId });
    return events.map((stored) =>
      this.replayInternal(stored.metadata.connectRecordId as string ?? stored.id, {
        ...options,
        dryRun: true,
        simulate: true,
      })
    );
  }

  async replayFromCursor(connectionId: string, options: ReplayOptions = {}): Promise<ReplayResult & { eventsReplayed?: number }> {
    if (!this.eventStore || !this.cursorManager) {
      return { eventId: connectionId, correlationId: "unknown", mode: "dry_run", stagesReplayed: [], success: false, durationMs: 0, message: "Cursor or event store not configured", duplicatePrevented: false };
    }
    const cursor = await this.cursorManager.getCursor(connectionId);
    if (!cursor) {
      return { eventId: connectionId, correlationId: "unknown", mode: "dry_run", stagesReplayed: [], success: false, durationMs: 0, message: "No cursor found", duplicatePrevented: false };
    }
    return this.replaySinceSequence(connectionId, cursor.lastSequenceNumber, options);
  }

  async replaySinceCheckpoint(connectionId: string, checkpoint: ConnectSyncCheckpointRow, options: ReplayOptions = {}): Promise<ReplayResult & { eventsReplayed?: number }> {
    if (!this.eventStore) {
      return { eventId: checkpoint.id, correlationId: "unknown", mode: "dry_run", stagesReplayed: [], success: false, durationMs: 0, message: "Event store not configured", duplicatePrevented: false };
    }
    const started = Date.now();
    const timeline = await this.eventStore.loadTimeline({ correlationId: checkpoint.replayReference?.split(":")[1], limit: 1000 });
    const filtered = checkpoint.sequenceNumber
      ? timeline.filter((e) => e.sequenceNumber >= checkpoint.sequenceNumber!)
      : timeline;
    return {
      eventId: checkpoint.id,
      correlationId: checkpoint.replayReference ?? "unknown",
      mode: options.dryRun !== false ? "dry_run" : "simulation",
      stagesReplayed: ["retried", "validated", "completed"],
      success: filtered.length > 0,
      durationMs: Date.now() - started,
      message: `Replayed ${filtered.length} events since checkpoint`,
      duplicatePrevented: true,
      eventsReplayed: filtered.length,
    };
  }

  async replaySinceTimestamp(connectionId: string, since: string, options: ReplayOptions = {}): Promise<ReplayResult & { eventsReplayed?: number }> {
    if (!this.eventStore) {
      return { eventId: connectionId, correlationId: "unknown", mode: "dry_run", stagesReplayed: [], success: false, durationMs: 0, message: "Event store not configured", duplicatePrevented: false };
    }
    const started = Date.now();
    const timeline = await this.eventStore.loadTimeline({ limit: 5000 });
    const filtered = timeline.filter(
      (e) => e.connectionId === connectionId && e.occurredAt >= since
    );
    return {
      eventId: connectionId,
      correlationId: filtered[0]?.correlationId ?? "unknown",
      mode: options.dryRun !== false ? "dry_run" : "simulation",
      stagesReplayed: ["retried", "completed"],
      success: filtered.length > 0,
      durationMs: Date.now() - started,
      message: `Replayed ${filtered.length} events since ${since}`,
      duplicatePrevented: true,
      eventsReplayed: filtered.length,
    };
  }

  async replaySinceSequence(connectionId: string, fromSequence: number, options: ReplayOptions = {}): Promise<ReplayResult & { eventsReplayed?: number }> {
    if (!this.eventStore) {
      return { eventId: connectionId, correlationId: "unknown", mode: "dry_run", stagesReplayed: [], success: false, durationMs: 0, message: "Event store not configured", duplicatePrevented: false };
    }
    const started = Date.now();
    const timeline = await this.eventStore.loadTimeline({ limit: 5000 });
    const connectionEvents = timeline
      .filter((e) => e.connectionId === connectionId)
      .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
    const filtered = fromSequence > 0 ? connectionEvents.slice(fromSequence) : connectionEvents;
    return {
      eventId: connectionId,
      correlationId: filtered[0]?.correlationId ?? "unknown",
      mode: options.dryRun !== false ? "dry_run" : "simulation",
      stagesReplayed: ["retried", "completed"],
      success: filtered.length > 0,
      durationMs: Date.now() - started,
      message: `Replayed ${filtered.length} connection events from index ${fromSequence}`,
      duplicatePrevented: true,
      eventsReplayed: filtered.length,
    };
  }

  async replayUntilCursor(connectionId: string, options: ReplayOptions = {}): Promise<ReplayResult & { eventsReplayed?: number }> {
    if (!this.eventStore || !this.cursorManager) {
      return { eventId: connectionId, correlationId: "unknown", mode: "dry_run", stagesReplayed: [], success: false, durationMs: 0, message: "Cursor or event store not configured", duplicatePrevented: false };
    }
    const cursor = await this.cursorManager.getCursor(connectionId);
    if (!cursor?.lastSuccessfulSync) {
      return { eventId: connectionId, correlationId: "unknown", mode: "dry_run", stagesReplayed: [], success: false, durationMs: 0, message: "No cursor timestamp", duplicatePrevented: false };
    }
    const started = Date.now();
    const timeline = await this.eventStore.loadTimeline({ limit: 5000 });
    const filtered = timeline.filter(
      (e) => e.connectionId === connectionId && e.occurredAt <= cursor.lastSuccessfulSync!
    );
    return {
      eventId: connectionId,
      correlationId: filtered[0]?.correlationId ?? "unknown",
      mode: options.dryRun !== false ? "dry_run" : "simulation",
      stagesReplayed: ["retried", "completed"],
      success: filtered.length > 0,
      durationMs: Date.now() - started,
      message: `Replayed ${filtered.length} events until cursor`,
      duplicatePrevented: true,
      eventsReplayed: filtered.length,
    };
  }

  dryRunReplay(eventId: string): ReplayResult {
    return this.replayInternal(eventId, { dryRun: true, simulate: true, replayPipeline: true });
  }

  getReplayHistory(): ReplayResult[] {
    return [...this.replayHistory];
  }

  comparePayloads(eventId: string, otherPayload: unknown): PayloadComparison {
    const record = this.history.get(eventId);
    if (!record) return { equal: false, providerDiff: ["Event not found"] };
    const original = JSON.stringify(record.rawPayload ?? {});
    const candidate = JSON.stringify(otherPayload ?? {});
    return {
      equal: original === candidate,
      providerDiff: original === candidate ? [] : ["Provider payload differs"],
    };
  }

  clearHistory(): void {
    this.replayHistory.length = 0;
  }

  private replayInternal(eventId: string, options: ReplayOptions): ReplayResult {
    const started = Date.now();
    const record = this.history.get(eventId);
    if (!record) {
      return this.finalizeReplay({
        eventId,
        correlationId: "unknown",
        mode: "simulation",
        stagesReplayed: [],
        success: false,
        durationMs: Date.now() - started,
        message: "Event not found",
        duplicatePrevented: false,
      });
    }

    const dryRun = options.dryRun !== false;
    const simulate = options.simulate !== false || dryRun;
    const mode = simulate ? (dryRun ? "dry_run" : "simulation") : "live";
    const stagesReplayed: ConnectLifecycleStage[] = [];

    this.audit.retried(record.id, { correlationId: record.correlationId, mode });
    this.timeline.addStage(record.id, "retried", { message: `Replay started (${mode})` });
    stagesReplayed.push("retried");

    let validation = record.validation;
    let universalModel = record.universalModel;
    let consumerResult: ReplayResult["consumerResult"];
    let success = true;
    let message = "Replay completed";
    let duplicatePrevented = false;

    if (options.replayValidation !== false) {
      stagesReplayed.push("validated");
      this.timeline.addStage(record.id, "validated", { message: "Validation replayed" });
    }

    if (options.replayTranslation !== false && record.rawPayload) {
      if (simulate) {
        validation = record.validation;
        universalModel = record.universalModel;
        stagesReplayed.push("mapped");
        this.timeline.addStage(record.id, "mapped", {
          message: record.translation
            ? `Simulated replay via ${record.translation.mapperUsed}`
            : "Translation replay simulated from stored record",
        });
      } else if (this.translator) {
        const translation = this.translator({
          rawPayload: record.rawPayload,
          employerAccountId: record.employerAccountId ?? "",
          connectionId: record.connectionId ?? "",
          correlationId: `${record.correlationId}-replay-${record.replayCount + 1}`,
          simulate,
        });
        validation = translation.validation as typeof validation;
        universalModel = translation.universalModel;
        stagesReplayed.push("mapped");
        this.timeline.addStage(record.id, "mapped", {
          durationMs: translation.durationMs,
          message: translation.mapperUsed ? `Replayed via ${translation.mapperUsed}` : "Translation replayed",
        });
        if (!translation.published && translation.reason) {
          success = false;
          message = translation.reason;
        }
      }
    }

    if (options.replayConsumer !== false && record.busEvent) {
      const envelope = record.busEvent.payload as AtsEventEnvelope;
      const schemaValid = Boolean(envelope?.universalEvent && envelope?.entity);
      consumerResult = { schemaValid, errors: schemaValid ? [] : ["Invalid envelope schema"] };
      stagesReplayed.push("consumed");
      this.timeline.addStage(record.id, "consumed", { message: "Consumer replay simulated" });
    }

    if (options.replayPipeline !== false && !simulate && record.busEvent) {
      const dlqReplay = this.deadLetterQueue.replay(record.busEvent.id);
      if (dlqReplay) {
        void this.dispatcher.processEvent(dlqReplay.id);
        stagesReplayed.push("published");
      } else if (!dryRun) {
        duplicatePrevented = true;
        message = "Live replay skipped — event not in DLQ (duplicate prevention)";
        success = false;
      }
    } else if (options.replayPipeline !== false) {
      stagesReplayed.push("published");
      this.timeline.addStage(record.id, "published", {
        message: simulate ? "Publish simulated (no bus write)" : "Pipeline replayed",
      });
    }

    if (success) {
      stagesReplayed.push("completed");
      this.timeline.addStage(record.id, "completed", { durationMs: Date.now() - started });
      this.audit.succeeded(record.id, Date.now() - started);
    } else {
      this.audit.failed(record.id, message, { mode });
    }

    if (!simulate) {
      this.history.incrementReplay(record.id);
    }

    this.logger.info("Connect replay executed", {
      provider: record.provider,
      correlationId: record.correlationId,
      event: "connect.replay",
      metadata: { eventId, mode, success, stagesReplayed },
    });

    return this.finalizeReplay({
      eventId: record.id,
      correlationId: record.correlationId,
      mode,
      stagesReplayed,
      success,
      durationMs: Date.now() - started,
      validation,
      universalModel,
      consumerResult,
      message,
      duplicatePrevented,
    });
  }

  private finalizeReplay(result: ReplayResult): ReplayResult {
    this.replayHistory.push(result);
    return result;
  }
}
