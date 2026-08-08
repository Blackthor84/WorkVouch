import type { EventStoreRepository } from "../persistence/repositories/event-store-repository";
import type {
  AppendConnectEventInput,
  ConnectStoredEvent,
  EventStreamFilter,
  TimelineFilter,
} from "../persistence/types";
import { CONNECT_PLATFORM_VERSION } from "../version";

export interface ReplayStreamOptions {
  dryRun?: boolean;
  fromSequence?: number;
}

export interface ReplayStreamResult {
  events: ConnectStoredEvent[];
  projectedState: Record<string, unknown>;
  dryRun: boolean;
}

/** Append-only event store — immutable history, never overwrites. */
export class ConnectEventStore {
  constructor(private readonly repository: EventStoreRepository) {}

  async appendEvent(input: AppendConnectEventInput): Promise<ConnectStoredEvent> {
    if (input.idempotencyKey) {
      const existing = await this.repository.findByIdempotencyKey(input.idempotencyKey);
      if (existing) return existing;
    }

    return this.repository.append({
      ...input,
      connectVersion: input.connectVersion ?? CONNECT_PLATFORM_VERSION,
    });
  }

  async loadEvent(eventId: string): Promise<ConnectStoredEvent | null> {
    return this.repository.getById(eventId);
  }

  async loadStream(filter: EventStreamFilter): Promise<ConnectStoredEvent[]> {
    return this.repository.loadStream(filter);
  }

  async loadTimeline(filter: TimelineFilter): Promise<ConnectStoredEvent[]> {
    return this.repository.loadTimeline(filter);
  }

  async replayStream(
    aggregateType: EventStreamFilter["aggregateType"],
    aggregateId: string,
    options: ReplayStreamOptions = {}
  ): Promise<ReplayStreamResult> {
    const events = await this.loadStream({
      aggregateType,
      aggregateId,
      fromSequence: options.fromSequence,
    });

    const projectedState: Record<string, unknown> = {
      aggregateType,
      aggregateId,
      eventCount: events.length,
      lastEventType: events.at(-1)?.eventType,
      lastSequence: events.at(-1)?.sequenceNumber ?? 0,
      timeline: events.map((e) => ({
        sequenceNumber: e.sequenceNumber,
        eventType: e.eventType,
        occurredAt: e.occurredAt,
      })),
    };

    return { events, projectedState, dryRun: options.dryRun !== false };
  }

  async getLatestSnapshot(
    aggregateType: EventStreamFilter["aggregateType"],
    aggregateId: string
  ): Promise<{ sequenceNumber: number; lastEvent: ConnectStoredEvent | null }> {
    const sequenceNumber = await this.repository.getLatestSequence(aggregateType, aggregateId);
    const stream = await this.loadStream({ aggregateType, aggregateId });
    return {
      sequenceNumber,
      lastEvent: stream.at(-1) ?? null,
    };
  }
}
