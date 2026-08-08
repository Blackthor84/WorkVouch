import type { ConnectSyncCheckpointRow, SyncCheckpointInput } from "../../sync/types";

export interface SyncCheckpointRepository {
  create(input: SyncCheckpointInput): Promise<ConnectSyncCheckpointRow>;
  getById(id: string): Promise<ConnectSyncCheckpointRow | null>;
  getLatest(cursorId: string): Promise<ConnectSyncCheckpointRow | null>;
  listByCursor(cursorId: string, limit?: number): Promise<ConnectSyncCheckpointRow[]>;
  listByConnection(connectionId: string, limit?: number): Promise<ConnectSyncCheckpointRow[]>;
}
