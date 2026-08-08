import { randomUUID } from "crypto";
import { nowIso } from "../../../utils/correlation";
import type {
  AppendConnectEventInput,
  ConnectStoredEvent,
  EventStreamFilter,
  TimelineFilter,
} from "../types";
import type { EventStoreRepository } from "../repositories/event-store-repository";

/** In-memory event store for tests and local development. */
export class InMemoryEventStoreRepository implements EventStoreRepository {
  private readonly events = new Map<string, ConnectStoredEvent>();
  private readonly streams = new Map<string, ConnectStoredEvent[]>();
  private readonly idempotency = new Map<string, string>();

  private streamKey(aggregateType: string, aggregateId: string): string {
    return `${aggregateType}:${aggregateId}`;
  }

  async append(input: AppendConnectEventInput): Promise<ConnectStoredEvent> {
    if (input.idempotencyKey) {
      const existingId = this.idempotency.get(input.idempotencyKey);
      if (existingId) {
        const existing = this.events.get(existingId);
        if (existing) return existing;
      }
    }

    const key = this.streamKey(input.aggregateType, input.aggregateId);
    const stream = this.streams.get(key) ?? [];
    const sequenceNumber = stream.length + 1;
    const recordedAt = nowIso();

    const event: ConnectStoredEvent = {
      id: input.id ?? randomUUID(),
      correlationId: input.correlationId,
      provider: input.provider,
      providerVersion: input.providerVersion,
      connectVersion: input.connectVersion,
      companyId: input.companyId,
      connectionId: input.connectionId,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      sequenceNumber,
      eventType: input.eventType,
      providerEventType: input.providerEventType,
      payload: input.payload,
      metadata: input.metadata ?? {},
      occurredAt: input.occurredAt ?? recordedAt,
      recordedAt,
    };

    this.events.set(event.id, event);
    stream.push(event);
    this.streams.set(key, stream);

    if (input.idempotencyKey) {
      this.idempotency.set(input.idempotencyKey, event.id);
    }

    return { ...event };
  }

  async getById(eventId: string): Promise<ConnectStoredEvent | null> {
    const event = this.events.get(eventId);
    return event ? { ...event } : null;
  }

  async loadStream(filter: EventStreamFilter): Promise<ConnectStoredEvent[]> {
    const key = this.streamKey(filter.aggregateType, filter.aggregateId);
    let stream = [...(this.streams.get(key) ?? [])];
    if (filter.fromSequence) {
      stream = stream.filter((e) => e.sequenceNumber >= filter.fromSequence!);
    }
    if (filter.limit) stream = stream.slice(0, filter.limit);
    return stream.map((e) => ({ ...e }));
  }

  async loadTimeline(filter: TimelineFilter): Promise<ConnectStoredEvent[]> {
    let results = Array.from(this.events.values());
    if (filter.correlationId) {
      results = results.filter((e) => e.correlationId === filter.correlationId);
    }
    if (filter.companyId) results = results.filter((e) => e.companyId === filter.companyId);
    if (filter.connectionId) results = results.filter((e) => e.connectionId === filter.connectionId);
    if (filter.aggregateType) results = results.filter((e) => e.aggregateType === filter.aggregateType);
    if (filter.aggregateId) results = results.filter((e) => e.aggregateId === filter.aggregateId);
    if (filter.fromOccurredAt) {
      results = results.filter((e) => e.occurredAt >= filter.fromOccurredAt!);
    }
    if (filter.toOccurredAt) {
      results = results.filter((e) => e.occurredAt <= filter.toOccurredAt!);
    }
    results.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
    if (filter.limit) results = results.slice(-filter.limit);
    return results.map((e) => ({ ...e }));
  }

  async getLatestSequence(aggregateType: string, aggregateId: string): Promise<number> {
    const stream = this.streams.get(this.streamKey(aggregateType, aggregateId)) ?? [];
    return stream.length > 0 ? stream[stream.length - 1].sequenceNumber : 0;
  }

  async findByIdempotencyKey(key: string): Promise<ConnectStoredEvent | null> {
    const id = this.idempotency.get(key);
    return id ? this.getById(id) : null;
  }

  clear(): void {
    this.events.clear();
    this.streams.clear();
    this.idempotency.clear();
  }

  size(): number {
    return this.events.size;
  }
}
