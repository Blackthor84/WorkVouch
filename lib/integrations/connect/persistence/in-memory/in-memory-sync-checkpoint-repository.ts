import { randomUUID } from "crypto";
import { nowIso } from "../../../utils/correlation";
import type { ConnectSyncCheckpointRow, SyncCheckpointInput } from "../../sync/types";
import type { SyncCheckpointRepository } from "../repositories/sync-checkpoint-repository";

export class InMemorySyncCheckpointRepository implements SyncCheckpointRepository {
  private readonly rows: ConnectSyncCheckpointRow[] = [];

  async create(input: SyncCheckpointInput): Promise<ConnectSyncCheckpointRow> {
    const row: ConnectSyncCheckpointRow = {
      id: randomUUID(),
      cursorId: input.cursorId,
      connectionId: input.connectionId,
      provider: input.provider,
      checkpointAt: nowIso(),
      sequenceNumber: input.sequenceNumber,
      eventCount: input.eventCount,
      durationMs: input.durationMs,
      importedCandidates: input.importedCandidates,
      importedJobs: input.importedJobs,
      importedApplications: input.importedApplications,
      snapshotId: input.snapshotId,
      replayReference: input.replayReference,
      syncType: input.syncType,
      metadata: input.metadata ?? {},
      createdAt: nowIso(),
    };
    this.rows.push(row);
    return { ...row };
  }

  async getById(id: string): Promise<ConnectSyncCheckpointRow | null> {
    const row = this.rows.find((r) => r.id === id);
    return row ? { ...row } : null;
  }

  async getLatest(cursorId: string): Promise<ConnectSyncCheckpointRow | null> {
    const matches = this.rows.filter((r) => r.cursorId === cursorId);
    return matches.length > 0 ? { ...matches[matches.length - 1] } : null;
  }

  async listByCursor(cursorId: string, limit = 20): Promise<ConnectSyncCheckpointRow[]> {
    return this.rows.filter((r) => r.cursorId === cursorId).slice(-limit).map((r) => ({ ...r }));
  }

  async listByConnection(connectionId: string, limit = 20): Promise<ConnectSyncCheckpointRow[]> {
    return this.rows.filter((r) => r.connectionId === connectionId).slice(-limit).map((r) => ({ ...r }));
  }

  clear(): void {
    this.rows.length = 0;
  }
}
