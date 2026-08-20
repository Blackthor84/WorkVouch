import { randomUUID } from "crypto";
import { nowIso } from "../../../utils/correlation";
import type {
  AdvanceCursorInput,
  ConnectSyncCursorRow,
  SyncCursorStatus,
} from "../../sync/types";
import type { AtsProviderId } from "../../../types/common";
import type { SyncCursorRepository } from "../repositories/sync-cursor-repository";

export class InMemorySyncCursorRepository implements SyncCursorRepository {
  private readonly rows = new Map<string, ConnectSyncCursorRow>();

  async create(input: Omit<ConnectSyncCursorRow, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<ConnectSyncCursorRow> {
    const now = nowIso();
    const row: ConnectSyncCursorRow = {
      id: input.id ?? randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(row.id, { ...row, syncCursor: { ...row.syncCursor }, providerCursor: { ...row.providerCursor }, metadata: { ...row.metadata } });
    return { ...row };
  }

  async getById(id: string): Promise<ConnectSyncCursorRow | null> {
    const row = this.rows.get(id);
    return row ? this.copyRow(row) : null;
  }

  async getByConnectionId(connectionId: string): Promise<ConnectSyncCursorRow | null> {
    const row = Array.from(this.rows.values()).find((r) => r.connectionId === connectionId);
    return row ? this.copyRow(row) : null;
  }

  async update(id: string, input: Partial<ConnectSyncCursorRow>): Promise<ConnectSyncCursorRow | null> {
    const row = this.rows.get(id);
    if (!row) return null;
    const updated = { ...row, ...input, updatedAt: nowIso() };
    this.rows.set(id, updated);
    return this.copyRow(updated);
  }

  async advance(id: string, input: AdvanceCursorInput): Promise<ConnectSyncCursorRow | null> {
    const row = this.rows.get(id);
    if (!row) return null;
    const updated: ConnectSyncCursorRow = {
      ...row,
      lastSuccessfulSync: input.lastSuccessfulSync ?? row.lastSuccessfulSync,
      lastCandidateImported: input.lastCandidateImported ?? row.lastCandidateImported,
      lastJobImported: input.lastJobImported ?? row.lastJobImported,
      lastApplicationImported: input.lastApplicationImported ?? row.lastApplicationImported,
      lastEventReceived: input.lastEventReceived ?? row.lastEventReceived,
      lastWebhookProcessed: input.lastWebhookProcessed ?? row.lastWebhookProcessed,
      lastProjectionCompleted: input.lastProjectionCompleted ?? row.lastProjectionCompleted,
      syncCursor: { ...row.syncCursor, ...input.syncCursor },
      providerCursor: { ...row.providerCursor, ...input.providerCursor },
      lastSequenceNumber: input.lastSequenceNumber ?? row.lastSequenceNumber,
      lastSnapshotId: input.lastSnapshotId ?? row.lastSnapshotId,
      lastSnapshotAt: input.lastSnapshotAt ?? row.lastSnapshotAt,
      status: input.status ?? "idle",
      metadata: input.metadata ? { ...row.metadata, ...input.metadata } : row.metadata,
      lastError: undefined,
      lastErrorAt: undefined,
      retryCount: 0,
      updatedAt: nowIso(),
    };
    this.rows.set(id, updated);
    return this.copyRow(updated);
  }

  async reset(id: string): Promise<ConnectSyncCursorRow | null> {
    const row = this.rows.get(id);
    if (!row) return null;
    const updated: ConnectSyncCursorRow = {
      ...row,
      lastSuccessfulSync: undefined,
      lastCandidateImported: undefined,
      lastJobImported: undefined,
      lastApplicationImported: undefined,
      lastEventReceived: undefined,
      lastWebhookProcessed: undefined,
      lastProjectionCompleted: undefined,
      nextScheduledSync: undefined,
      syncCursor: {},
      providerCursor: {},
      lastSequenceNumber: 0,
      lastSnapshotId: undefined,
      lastSnapshotAt: undefined,
      lastError: undefined,
      lastErrorAt: undefined,
      retryCount: 0,
      status: "idle",
      updatedAt: nowIso(),
    };
    this.rows.set(id, updated);
    return this.copyRow(updated);
  }

  async archive(id: string): Promise<ConnectSyncCursorRow | null> {
    return this.update(id, { status: "archived" });
  }

  async clone(sourceId: string, targetConnectionId: string): Promise<ConnectSyncCursorRow> {
    const source = this.rows.get(sourceId);
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
    return Array.from(this.rows.values())
      .filter((r) => r.provider === provider && (!status || r.status === status))
      .map((r) => this.copyRow(r));
  }

  async recordError(id: string, error: string): Promise<ConnectSyncCursorRow | null> {
    const row = this.rows.get(id);
    if (!row) return null;
    return this.update(id, { lastError: error, lastErrorAt: nowIso(), status: "error" });
  }

  async incrementRetry(id: string): Promise<ConnectSyncCursorRow | null> {
    const row = this.rows.get(id);
    if (!row) return null;
    return this.update(id, { retryCount: row.retryCount + 1 });
  }

  async scheduleNextSync(id: string, nextScheduledSync: string): Promise<ConnectSyncCursorRow | null> {
    return this.update(id, { nextScheduledSync });
  }

  clear(): void {
    this.rows.clear();
  }

  private copyRow(row: ConnectSyncCursorRow): ConnectSyncCursorRow {
    return {
      ...row,
      syncCursor: { ...row.syncCursor },
      providerCursor: { ...row.providerCursor },
      metadata: { ...row.metadata },
    };
  }
}
