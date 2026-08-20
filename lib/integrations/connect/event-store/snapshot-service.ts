import type { ConnectEventStore } from "../event-store/connect-event-store";
import type { ProjectionEngine } from "../projection/projection-engine";
import type { SnapshotRepository } from "../persistence/repositories/snapshot-repository";
import type { ConnectAggregateType, ConnectStoredEvent, SnapshotConfig } from "../persistence/types";
import { nowIso } from "../../utils/correlation";

export interface SnapshotResult {
  aggregateType: ConnectAggregateType;
  aggregateId: string;
  sequenceNumber: number;
  eventCount: number;
  snapshotType: "automatic" | "manual";
  createdAt: string;
}

const DEFAULT_SNAPSHOT_CONFIG: SnapshotConfig = { eventsPerSnapshot: 50 };

/** Event store snapshots for fast projection rebuild and replay. */
export class SnapshotService {
  constructor(
    private readonly eventStore: ConnectEventStore,
    private readonly snapshots: SnapshotRepository,
    private readonly projections: ProjectionEngine,
    private readonly config: SnapshotConfig = DEFAULT_SNAPSHOT_CONFIG
  ) {}

  async createSnapshot(
    aggregateType: ConnectAggregateType,
    aggregateId: string,
    snapshotType: "automatic" | "manual" = "manual"
  ): Promise<SnapshotResult> {
    const events = await this.eventStore.loadStream({ aggregateType, aggregateId });
    const projection = await this.projections.projectState(aggregateType, aggregateId, `${aggregateType}_current_state`);
    const sequenceNumber = events.at(-1)?.sequenceNumber ?? 0;

    const saved = await this.snapshots.save({
      aggregateType,
      aggregateId,
      sequenceNumber,
      state: projection?.state ?? {},
      eventCount: events.length,
      snapshotType,
    });

    return {
      aggregateType,
      aggregateId,
      sequenceNumber: saved.sequenceNumber,
      eventCount: saved.eventCount,
      snapshotType: saved.snapshotType,
      createdAt: saved.createdAt,
    };
  }

  async loadSnapshot(aggregateType: ConnectAggregateType, aggregateId: string) {
    return this.snapshots.getLatest(aggregateType, aggregateId);
  }

  async restoreSnapshot(aggregateType: ConnectAggregateType, aggregateId: string) {
    const snapshot = await this.snapshots.getLatest(aggregateType, aggregateId);
    if (!snapshot) return null;

    const replayFrom = snapshot.sequenceNumber + 1;
    const tailEvents = await this.eventStore.loadStream({
      aggregateType,
      aggregateId,
      fromSequence: replayFrom,
    });

    let state = { ...snapshot.state };
    for (const event of tailEvents) {
      state = this.applyEvent(state, event);
    }

    return { snapshot, state, tailEventsApplied: tailEvents.length };
  }

  async maybeCreateAutomaticSnapshot(aggregateType: ConnectAggregateType, aggregateId: string): Promise<SnapshotResult | null> {
    const events = await this.eventStore.loadStream({ aggregateType, aggregateId });
    if (events.length === 0 || events.length % this.config.eventsPerSnapshot !== 0) return null;
    return this.createSnapshot(aggregateType, aggregateId, "automatic");
  }

  async replayFromSnapshot(aggregateType: ConnectAggregateType, aggregateId: string) {
    const restored = await this.restoreSnapshot(aggregateType, aggregateId);
    const stream = await this.eventStore.replayStream(aggregateType, aggregateId, { dryRun: true });
    return { restored, replay: stream };
  }

  private applyEvent(state: Record<string, unknown>, event: ConnectStoredEvent): Record<string, unknown> {
    return {
      ...state,
      lastEventType: event.eventType,
      lastOccurredAt: event.occurredAt,
      eventsApplied: ((state.eventsApplied as number) ?? 0) + 1,
    };
  }

  get evaluatedAt(): string {
    return nowIso();
  }
}
