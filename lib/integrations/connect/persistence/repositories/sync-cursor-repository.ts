import type {
  AdvanceCursorInput,
  ConnectSyncCursorRow,
  SyncCursorStatus,
} from "../../sync/types";
import type { AtsProviderId } from "../../../types/common";

export interface SyncCursorRepository {
  create(input: Omit<ConnectSyncCursorRow, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<ConnectSyncCursorRow>;
  getById(id: string): Promise<ConnectSyncCursorRow | null>;
  getByConnectionId(connectionId: string): Promise<ConnectSyncCursorRow | null>;
  update(id: string, input: Partial<ConnectSyncCursorRow>): Promise<ConnectSyncCursorRow | null>;
  advance(id: string, input: AdvanceCursorInput): Promise<ConnectSyncCursorRow | null>;
  reset(id: string): Promise<ConnectSyncCursorRow | null>;
  archive(id: string): Promise<ConnectSyncCursorRow | null>;
  clone(sourceId: string, targetConnectionId: string): Promise<ConnectSyncCursorRow>;
  listByProvider(provider: AtsProviderId, status?: SyncCursorStatus): Promise<ConnectSyncCursorRow[]>;
  recordError(id: string, error: string): Promise<ConnectSyncCursorRow | null>;
  incrementRetry(id: string): Promise<ConnectSyncCursorRow | null>;
  scheduleNextSync(id: string, nextScheduledSync: string): Promise<ConnectSyncCursorRow | null>;
}
