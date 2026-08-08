import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntegrationEvent } from "../types/events";
import {
  type DeadLetterRecord,
  type DeadLetterStore,
  type DlqResolutionStatus,
  dlqRecordToIntegrationEvent,
  integrationEventToDlqRecord,
} from "./dead-letter-store";

function mapRow(row: Record<string, unknown>): DeadLetterRecord {
  return {
    id: String(row.id),
    sourceType: row.source_type as DeadLetterRecord["sourceType"],
    sourceId: row.source_id ? String(row.source_id) : undefined,
    connectionId: row.connection_id ? String(row.connection_id) : undefined,
    employerAccountId: row.employer_account_id ? String(row.employer_account_id) : undefined,
    provider: String(row.provider),
    correlationId: String(row.correlation_id),
    eventType: String(row.event_type),
    payload: (row.payload as Record<string, unknown>) ?? {},
    failureReason: row.failure_reason ? String(row.failure_reason) : undefined,
    retryCount: Number(row.retry_count ?? 0),
    maxRetries: Number(row.max_retries ?? 5),
    resolutionStatus: row.resolution_status as DlqResolutionStatus,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    resolvedAt: row.resolved_at ? String(row.resolved_at) : undefined,
  };
}

export class SupabaseDeadLetterStore implements DeadLetterStore {
  constructor(private readonly client: SupabaseClient) {}

  async enqueue(
    event: IntegrationEvent,
    options?: { sourceType?: "webhook" | "event"; failureReason?: string }
  ): Promise<DeadLetterRecord> {
    const base = integrationEventToDlqRecord(event, options);
    const { data, error } = await this.client
      .from("connect_dead_letter_queue")
      .upsert(
        {
          id: base.id,
          source_type: base.sourceType,
          source_id: base.sourceId ?? null,
          connection_id: base.connectionId ?? null,
          employer_account_id: base.employerAccountId ?? null,
          provider: base.provider,
          correlation_id: base.correlationId,
          event_type: base.eventType,
          payload: base.payload,
          failure_reason: base.failureReason ?? null,
          retry_count: base.retryCount,
          max_retries: base.maxRetries,
          resolution_status: "pending",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select("*")
      .single();
    if (error) throw new Error(`DLQ enqueue failed: ${error.message}`);
    return mapRow(data as Record<string, unknown>);
  }

  async getById(id: string): Promise<DeadLetterRecord | null> {
    const { data, error } = await this.client
      .from("connect_dead_letter_queue")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`DLQ get failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async list(options?: {
    connectionId?: string;
    resolutionStatus?: DlqResolutionStatus;
    correlationId?: string;
    limit?: number;
  }): Promise<DeadLetterRecord[]> {
    let query = this.client.from("connect_dead_letter_queue").select("*");
    if (options?.connectionId) query = query.eq("connection_id", options.connectionId);
    if (options?.resolutionStatus) query = query.eq("resolution_status", options.resolutionStatus);
    if (options?.correlationId) query = query.eq("correlation_id", options.correlationId);
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(options?.limit ?? 50);
    if (error) throw new Error(`DLQ list failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }

  async markResolved(id: string): Promise<DeadLetterRecord | null> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from("connect_dead_letter_queue")
      .update({ resolution_status: "resolved", resolved_at: now, updated_at: now })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`DLQ resolve failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async incrementRetry(id: string, error?: string): Promise<DeadLetterRecord | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    const { data, error: updateError } = await this.client
      .from("connect_dead_letter_queue")
      .update({
        retry_count: existing.retryCount + 1,
        failure_reason: error ?? existing.failureReason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (updateError) throw new Error(`DLQ retry increment failed: ${updateError.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async size(): Promise<number> {
    const { count, error } = await this.client
      .from("connect_dead_letter_queue")
      .select("*", { count: "exact", head: true })
      .eq("resolution_status", "pending");
    if (error) throw new Error(`DLQ size failed: ${error.message}`);
    return count ?? 0;
  }
}

export { dlqRecordToIntegrationEvent };
