import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectSyncLogRow } from "../types";
import type { SyncLogRepository } from "../repositories/sync-log-repository";

function mapRow(row: Record<string, unknown>): ConnectSyncLogRow {
  return {
    id: String(row.id),
    connectionId: row.connection_id ? String(row.connection_id) : undefined,
    provider: row.provider as ConnectSyncLogRow["provider"],
    syncType: String(row.sync_type),
    externalId: String(row.external_id),
    direction: row.direction as ConnectSyncLogRow["direction"],
    status: String(row.status),
    durationMs: row.duration_ms != null ? Number(row.duration_ms) : undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  };
}

export class SupabaseSyncLogRepository implements SyncLogRepository {
  constructor(private readonly client: SupabaseClient) {}

  async append(input: Omit<ConnectSyncLogRow, "id" | "createdAt"> & { id?: string; createdAt?: string }): Promise<ConnectSyncLogRow> {
    const { data, error } = await this.client
      .from("connect_sync_log")
      .insert({
        id: input.id ?? randomUUID(),
        connection_id: input.connectionId ?? null,
        provider: input.provider,
        sync_type: input.syncType,
        external_id: input.externalId,
        direction: input.direction,
        status: input.status,
        duration_ms: input.durationMs ?? null,
        metadata: input.metadata,
        created_at: input.createdAt ?? new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw new Error(`Sync log append failed: ${error.message}`);
    return mapRow(data as Record<string, unknown>);
  }

  async listByConnection(connectionId: string, limit = 50): Promise<ConnectSyncLogRow[]> {
    const { data, error } = await this.client
      .from("connect_sync_log")
      .select("*")
      .eq("connection_id", connectionId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Sync log list failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }
}
