import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AdvanceCursorInput,
  ConnectSyncCursorRow,
  SyncCursorPayload,
  ProviderCursorPayload,
  SyncCursorStatus,
} from "../../sync/types";
import type { AtsProviderId } from "../../../types/common";
import type { SyncCursorRepository } from "../repositories/sync-cursor-repository";

function mapRow(row: Record<string, unknown>): ConnectSyncCursorRow {
  return {
    id: String(row.id),
    connectionId: String(row.connection_id),
    provider: row.provider as AtsProviderId,
    providerVersion: String(row.provider_version),
    connectVersion: String(row.connect_version),
    lastSuccessfulSync: row.last_successful_sync ? String(row.last_successful_sync) : undefined,
    lastCandidateImported: row.last_candidate_imported ? String(row.last_candidate_imported) : undefined,
    lastJobImported: row.last_job_imported ? String(row.last_job_imported) : undefined,
    lastApplicationImported: row.last_application_imported ? String(row.last_application_imported) : undefined,
    lastEventReceived: row.last_event_received ? String(row.last_event_received) : undefined,
    lastWebhookProcessed: row.last_webhook_processed ? String(row.last_webhook_processed) : undefined,
    lastProjectionCompleted: row.last_projection_completed ? String(row.last_projection_completed) : undefined,
    nextScheduledSync: row.next_scheduled_sync ? String(row.next_scheduled_sync) : undefined,
    syncCursor: (row.sync_cursor as SyncCursorPayload) ?? {},
    providerCursor: (row.provider_cursor as ProviderCursorPayload) ?? {},
    lastSequenceNumber: Number(row.last_sequence_number ?? 0),
    lastSnapshotId: row.last_snapshot_id ? String(row.last_snapshot_id) : undefined,
    lastSnapshotAt: row.last_snapshot_at ? String(row.last_snapshot_at) : undefined,
    lastError: row.last_error ? String(row.last_error) : undefined,
    lastErrorAt: row.last_error_at ? String(row.last_error_at) : undefined,
    retryCount: Number(row.retry_count ?? 0),
    status: row.status as SyncCursorStatus,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class SupabaseSyncCursorRepository implements SyncCursorRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(input: Omit<ConnectSyncCursorRow, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<ConnectSyncCursorRow> {
    const { data, error } = await this.client
      .from("connect_sync_cursor")
      .insert({
        id: input.id ?? randomUUID(),
        connection_id: input.connectionId,
        provider: input.provider,
        provider_version: input.providerVersion,
        connect_version: input.connectVersion,
        sync_cursor: input.syncCursor,
        provider_cursor: input.providerCursor,
        last_sequence_number: input.lastSequenceNumber,
        retry_count: input.retryCount,
        status: input.status,
        metadata: input.metadata,
      })
      .select("*")
      .single();
    if (error) throw new Error(`Sync cursor create failed: ${error.message}`);
    return mapRow(data as Record<string, unknown>);
  }

  async getById(id: string): Promise<ConnectSyncCursorRow | null> {
    const { data, error } = await this.client.from("connect_sync_cursor").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Sync cursor get failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async getByConnectionId(connectionId: string): Promise<ConnectSyncCursorRow | null> {
    const { data, error } = await this.client.from("connect_sync_cursor").select("*").eq("connection_id", connectionId).maybeSingle();
    if (error) throw new Error(`Sync cursor lookup failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async update(id: string, input: Partial<ConnectSyncCursorRow>): Promise<ConnectSyncCursorRow | null> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.status) patch.status = input.status;
    if (input.syncCursor) patch.sync_cursor = input.syncCursor;
    if (input.providerCursor) patch.provider_cursor = input.providerCursor;
    if (input.lastSequenceNumber != null) patch.last_sequence_number = input.lastSequenceNumber;
    if (input.retryCount != null) patch.retry_count = input.retryCount;
    if (input.metadata) patch.metadata = input.metadata;
    if (input.nextScheduledSync) patch.next_scheduled_sync = input.nextScheduledSync;
    if (input.lastError !== undefined) patch.last_error = input.lastError;
    if (input.lastErrorAt !== undefined) patch.last_error_at = input.lastErrorAt;

    const { data, error } = await this.client.from("connect_sync_cursor").update(patch).eq("id", id).select("*").maybeSingle();
    if (error) throw new Error(`Sync cursor update failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async advance(id: string, input: AdvanceCursorInput): Promise<ConnectSyncCursorRow | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    const { data, error } = await this.client
      .from("connect_sync_cursor")
      .update({
        last_successful_sync: input.lastSuccessfulSync ?? existing.lastSuccessfulSync ?? new Date().toISOString(),
        last_candidate_imported: input.lastCandidateImported ?? existing.lastCandidateImported,
        last_job_imported: input.lastJobImported ?? existing.lastJobImported,
        last_application_imported: input.lastApplicationImported ?? existing.lastApplicationImported,
        last_event_received: input.lastEventReceived ?? existing.lastEventReceived,
        last_webhook_processed: input.lastWebhookProcessed ?? existing.lastWebhookProcessed,
        last_projection_completed: input.lastProjectionCompleted ?? existing.lastProjectionCompleted,
        sync_cursor: { ...existing.syncCursor, ...input.syncCursor },
        provider_cursor: { ...existing.providerCursor, ...input.providerCursor },
        last_sequence_number: input.lastSequenceNumber ?? existing.lastSequenceNumber,
        last_snapshot_id: input.lastSnapshotId ?? existing.lastSnapshotId,
        last_snapshot_at: input.lastSnapshotAt ?? existing.lastSnapshotAt,
        status: input.status ?? "idle",
        metadata: input.metadata ? { ...existing.metadata, ...input.metadata } : existing.metadata,
        last_error: null,
        last_error_at: null,
        retry_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Sync cursor advance failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async reset(id: string): Promise<ConnectSyncCursorRow | null> {
    const { data, error } = await this.client
      .from("connect_sync_cursor")
      .update({
        last_successful_sync: null,
        last_candidate_imported: null,
        last_job_imported: null,
        last_application_imported: null,
        last_event_received: null,
        last_webhook_processed: null,
        last_projection_completed: null,
        next_scheduled_sync: null,
        sync_cursor: {},
        provider_cursor: {},
        last_sequence_number: 0,
        last_snapshot_id: null,
        last_snapshot_at: null,
        last_error: null,
        last_error_at: null,
        retry_count: 0,
        status: "idle",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Sync cursor reset failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async archive(id: string): Promise<ConnectSyncCursorRow | null> {
    return this.update(id, { status: "archived" });
  }

  async clone(sourceId: string, targetConnectionId: string): Promise<ConnectSyncCursorRow> {
    const source = await this.getById(sourceId);
    if (!source) throw new Error(`Cursor ${sourceId} not found`);
    return this.create({
      connectionId: targetConnectionId,
      provider: source.provider,
      providerVersion: source.providerVersion,
      connectVersion: source.connectVersion,
      syncCursor: { ...source.syncCursor },
      providerCursor: { ...source.providerCursor },
      lastSequenceNumber: source.lastSequenceNumber,
      retryCount: 0,
      status: "idle",
      metadata: { ...source.metadata, clonedFrom: sourceId },
    });
  }

  async listByProvider(provider: AtsProviderId, status?: SyncCursorStatus): Promise<ConnectSyncCursorRow[]> {
    let query = this.client.from("connect_sync_cursor").select("*").eq("provider", provider);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw new Error(`Sync cursor list failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }

  async recordError(id: string, errorMessage: string): Promise<ConnectSyncCursorRow | null> {
    const { data, error } = await this.client
      .from("connect_sync_cursor")
      .update({ last_error: errorMessage, last_error_at: new Date().toISOString(), status: "error", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Sync cursor error record failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async incrementRetry(id: string): Promise<ConnectSyncCursorRow | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    return this.update(id, { retryCount: existing.retryCount + 1 });
  }

  async scheduleNextSync(id: string, nextScheduledSync: string): Promise<ConnectSyncCursorRow | null> {
    const { data, error } = await this.client
      .from("connect_sync_cursor")
      .update({ next_scheduled_sync: nextScheduledSync, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Sync cursor schedule failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }
}
