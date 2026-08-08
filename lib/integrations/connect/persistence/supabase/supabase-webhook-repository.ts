import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type { ConnectWebhookLogRow } from "../types";
import type { WebhookRepository } from "../repositories/webhook-repository";

function mapRow(row: Record<string, unknown>): ConnectWebhookLogRow {
  return {
    id: String(row.id),
    connectionId: row.connection_id ? String(row.connection_id) : undefined,
    provider: row.provider as ConnectWebhookLogRow["provider"],
    providerEventId: String(row.provider_event_id),
    providerEventType: String(row.provider_event_type),
    normalizedEventType: row.normalized_event_type ? String(row.normalized_event_type) : undefined,
    status: String(row.status),
    payloadHash: row.payload_hash ? String(row.payload_hash) : undefined,
    receivedAt: String(row.received_at),
    processedAt: row.processed_at ? String(row.processed_at) : undefined,
    durationMs: row.duration_ms != null ? Number(row.duration_ms) : undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  };
}

export class SupabaseWebhookRepository implements WebhookRepository {
  constructor(private readonly client: SupabaseClient) {}

  async append(
    input: Omit<ConnectWebhookLogRow, "id" | "receivedAt"> & { id?: string; receivedAt?: string }
  ): Promise<ConnectWebhookLogRow> {
    const { data, error } = await this.client
      .from("connect_webhook_log")
      .insert({
        id: input.id ?? randomUUID(),
        connection_id: input.connectionId ?? null,
        provider: input.provider,
        provider_event_id: input.providerEventId,
        provider_event_type: input.providerEventType,
        normalized_event_type: input.normalizedEventType ?? null,
        status: input.status,
        payload_hash: input.payloadHash ?? null,
        received_at: input.receivedAt ?? new Date().toISOString(),
        metadata: input.metadata,
      })
      .select("*")
      .single();
    if (error) throw new Error(`Webhook log append failed: ${error.message}`);
    return mapRow(data as Record<string, unknown>);
  }

  async getByProviderEventId(provider: string, providerEventId: string): Promise<ConnectWebhookLogRow | null> {
    const { data, error } = await this.client
      .from("connect_webhook_log")
      .select("*")
      .eq("provider", provider)
      .eq("provider_event_id", providerEventId)
      .maybeSingle();
    if (error) throw new Error(`Webhook log get failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async updateStatus(
    id: string,
    status: string,
    processedAt?: string,
    durationMs?: number
  ): Promise<ConnectWebhookLogRow | null> {
    const { data, error } = await this.client
      .from("connect_webhook_log")
      .update({
        status,
        processed_at: processedAt ?? new Date().toISOString(),
        duration_ms: durationMs ?? null,
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Webhook log update failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async listByConnection(connectionId: string, limit = 50): Promise<ConnectWebhookLogRow[]> {
    const { data, error } = await this.client
      .from("connect_webhook_log")
      .select("*")
      .eq("connection_id", connectionId)
      .order("received_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Webhook log list failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }
}
