import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type {
  AppendConnectEventInput,
  ConnectStoredEvent,
  EventStreamFilter,
  TimelineFilter,
} from "../types";
import type { EventStoreRepository } from "../repositories/event-store-repository";

function mapRow(row: Record<string, unknown>): ConnectStoredEvent {
  return {
    id: String(row.id),
    correlationId: String(row.correlation_id),
    provider: row.provider as ConnectStoredEvent["provider"],
    providerVersion: String(row.provider_version),
    connectVersion: String(row.connect_version),
    companyId: String(row.company_id),
    connectionId: row.connection_id ? String(row.connection_id) : undefined,
    aggregateType: row.aggregate_type as ConnectStoredEvent["aggregateType"],
    aggregateId: String(row.aggregate_id),
    sequenceNumber: Number(row.sequence_number),
    eventType: String(row.event_type),
    providerEventType: row.provider_event_type ? String(row.provider_event_type) : undefined,
    payload: (row.payload as Record<string, unknown>) ?? {},
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    occurredAt: String(row.occurred_at),
    recordedAt: String(row.recorded_at),
  };
}

/** Supabase-backed event store repository (service role only). */
export class SupabaseEventStoreRepository implements EventStoreRepository {
  constructor(private readonly client: SupabaseClient) {}

  async append(input: AppendConnectEventInput): Promise<ConnectStoredEvent> {
    if (input.idempotencyKey) {
      const existing = await this.findByIdempotencyKey(input.idempotencyKey);
      if (existing) return existing;
    }

    const latestSeq = await this.getLatestSequence(input.aggregateType, input.aggregateId);
    const sequenceNumber = latestSeq + 1;
    const id = input.id ?? randomUUID();
    const occurredAt = input.occurredAt ?? new Date().toISOString();

    const { data, error } = await this.client
      .from("connect_event_store")
      .insert({
        id,
        correlation_id: input.correlationId,
        provider: input.provider,
        provider_version: input.providerVersion,
        connect_version: input.connectVersion,
        company_id: input.companyId,
        connection_id: input.connectionId ?? null,
        aggregate_type: input.aggregateType,
        aggregate_id: input.aggregateId,
        sequence_number: sequenceNumber,
        event_type: input.eventType,
        provider_event_type: input.providerEventType ?? null,
        payload: input.payload,
        metadata: { ...(input.metadata ?? {}), idempotencyKey: input.idempotencyKey ?? null },
        occurred_at: occurredAt,
      })
      .select("*")
      .single();

    if (error) throw new Error(`Event store append failed: ${error.message}`);
    return mapRow(data as Record<string, unknown>);
  }

  async getById(eventId: string): Promise<ConnectStoredEvent | null> {
    const { data, error } = await this.client
      .from("connect_event_store")
      .select("*")
      .eq("id", eventId)
      .maybeSingle();
    if (error) throw new Error(`Event store get failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async loadStream(filter: EventStreamFilter): Promise<ConnectStoredEvent[]> {
    let query = this.client
      .from("connect_event_store")
      .select("*")
      .eq("aggregate_type", filter.aggregateType)
      .eq("aggregate_id", filter.aggregateId)
      .order("sequence_number", { ascending: true });

    if (filter.fromSequence) query = query.gte("sequence_number", filter.fromSequence);
    if (filter.limit) query = query.limit(filter.limit);

    const { data, error } = await query;
    if (error) throw new Error(`Event store stream load failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }

  async loadTimeline(filter: TimelineFilter): Promise<ConnectStoredEvent[]> {
    let query = this.client.from("connect_event_store").select("*").order("occurred_at", { ascending: true });
    if (filter.correlationId) query = query.eq("correlation_id", filter.correlationId);
    if (filter.companyId) query = query.eq("company_id", filter.companyId);
    if (filter.connectionId) query = query.eq("connection_id", filter.connectionId);
    if (filter.aggregateType) query = query.eq("aggregate_type", filter.aggregateType);
    if (filter.aggregateId) query = query.eq("aggregate_id", filter.aggregateId);
    if (filter.fromOccurredAt) query = query.gte("occurred_at", filter.fromOccurredAt);
    if (filter.toOccurredAt) query = query.lte("occurred_at", filter.toOccurredAt);
    if (filter.limit) query = query.limit(filter.limit);

    const { data, error } = await query;
    if (error) throw new Error(`Event store timeline load failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }

  async getLatestSequence(aggregateType: string, aggregateId: string): Promise<number> {
    const { data, error } = await this.client
      .from("connect_event_store")
      .select("sequence_number")
      .eq("aggregate_type", aggregateType)
      .eq("aggregate_id", aggregateId)
      .order("sequence_number", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Event store sequence lookup failed: ${error.message}`);
    return data ? Number((data as { sequence_number: number }).sequence_number) : 0;
  }

  async findByIdempotencyKey(key: string): Promise<ConnectStoredEvent | null> {
    const { data, error } = await this.client
      .from("connect_event_store")
      .select("*")
      .contains("metadata", { idempotencyKey: key })
      .maybeSingle();
    if (error) throw new Error(`Event store idempotency lookup failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }
}
