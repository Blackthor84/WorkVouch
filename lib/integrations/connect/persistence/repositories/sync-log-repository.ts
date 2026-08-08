import type { ConnectSyncLogRow } from "../types";

export interface SyncLogRepository {
  append(input: Omit<ConnectSyncLogRow, "id" | "createdAt"> & { id?: string; createdAt?: string }): Promise<ConnectSyncLogRow>;
  listByConnection(connectionId: string, limit?: number): Promise<ConnectSyncLogRow[]>;
}
