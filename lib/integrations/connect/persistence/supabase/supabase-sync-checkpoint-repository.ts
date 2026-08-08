import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectSyncCheckpointRow, SyncCheckpointInput } from "../../sync/types";
import type { SyncCheckpointRepository } from "../repositories/sync-checkpoint-repository";

function mapRow(row: Record<string, unknown>): ConnectSyncCheckpointRow {
  return {
    id: String(row.id),
    cursorId: String(row.cursor_id),
    connectionId: String(row.connection_id),
    provider: row.provider as ConnectSyncCheckpointRow["provider"],
    checkpointAt: String(row.checkpoint_at),
    sequenceNumber: row.sequence_number != null ? Number(row.sequence_number) : undefined,
    eventCount: Number(row.event_count),
    durationMs: Number(row.duration_ms),
    importedCandidates: Number(row.imported_candidates),
    importedJobs: Number(row.imported_jobs),
    importedApplications: Number(row.imported_applications),
    snapshotId: row.snapshot_id ? String(row.snapshot_id) : undefined,
    replayReference: row.replay_reference ? String(row.replay_reference) : undefined,
    syncType: row.sync_type as ConnectSyncCheckpointRow["syncType"],
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
  };
}

export class SupabaseSyncCheckpointRepository implements SyncCheckpointRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(input: SyncCheckpointInput): Promise<ConnectSyncCheckpointRow> {
    const { data, error } = await this.client
      .from("connect_sync_checkpoints")
      .insert({
        id: randomUUID(),
        cursor_id: input.cursorId,
        connection_id: input.connectionId,
        provider: input.provider,
        sequence_number: input.sequenceNumber ?? null,
        event_count: input.eventCount,
        duration_ms: input.durationMs,
        imported_candidates: input.importedCandidates,
        imported_jobs: input.importedJobs,
        imported_applications: input.importedApplications,
        snapshot_id: input.snapshotId ?? null,
        replay_reference: input.replayReference ?? null,
        sync_type: input.syncType,
        metadata: input.metadata ?? {},
      })
      .select("*")
      .single();
    if (error) throw new Error(`Sync checkpoint create failed: ${error.message}`);
    return mapRow(data as Record<string, unknown>);
  }

  async getById(id: string): Promise<ConnectSyncCheckpointRow | null> {
    const { data, error } = await this.client.from("connect_sync_checkpoints").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Sync checkpoint get failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async getLatest(cursorId: string): Promise<ConnectSyncCheckpointRow | null> {
    const { data, error } = await this.client
      .from("connect_sync_checkpoints")
      .select("*")
      .eq("cursor_id", cursorId)
      .order("checkpoint_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`Sync checkpoint latest failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async listByCursor(cursorId: string, limit = 20): Promise<ConnectSyncCheckpointRow[]> {
    const { data, error } = await this.client
      .from("connect_sync_checkpoints")
      .select("*")
      .eq("cursor_id", cursorId)
      .order("checkpoint_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Sync checkpoint list failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }

  async listByConnection(connectionId: string, limit = 20): Promise<ConnectSyncCheckpointRow[]> {
    const { data, error } = await this.client
      .from("connect_sync_checkpoints")
      .select("*")
      .eq("connection_id", connectionId)
      .order("checkpoint_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Sync checkpoint list failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }
}
