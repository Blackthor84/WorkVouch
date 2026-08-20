import { randomUUID } from "crypto";
import { nowIso } from "../../../utils/correlation";
import type { ConnectSyncLogRow } from "../types";
import type { SyncLogRepository } from "../repositories/sync-log-repository";

export class InMemorySyncLogRepository implements SyncLogRepository {
  private readonly rows: ConnectSyncLogRow[] = [];

  async append(input: Omit<ConnectSyncLogRow, "id" | "createdAt"> & { id?: string; createdAt?: string }): Promise<ConnectSyncLogRow> {
    const row: ConnectSyncLogRow = {
      id: input.id ?? randomUUID(),
      connectionId: input.connectionId,
      provider: input.provider,
      syncType: input.syncType,
      externalId: input.externalId,
      direction: input.direction,
      status: input.status,
      durationMs: input.durationMs,
      metadata: input.metadata,
      createdAt: input.createdAt ?? nowIso(),
    };
    this.rows.push(row);
    return { ...row };
  }

  async listByConnection(connectionId: string, limit = 50): Promise<ConnectSyncLogRow[]> {
    return this.rows
      .filter((r) => r.connectionId === connectionId)
      .slice(-limit)
      .map((r) => ({ ...r }));
  }

  clear(): void {
    this.rows.length = 0;
  }
}
