import type { ConnectEventSnapshotRow } from "../types";

export interface SnapshotRepository {
  save(row: Omit<ConnectEventSnapshotRow, "id" | "createdAt"> & { id?: string }): Promise<ConnectEventSnapshotRow>;
  getLatest(aggregateType: string, aggregateId: string): Promise<ConnectEventSnapshotRow | null>;
  getBySequence(aggregateType: string, aggregateId: string, sequenceNumber: number): Promise<ConnectEventSnapshotRow | null>;
  list(aggregateType: string, aggregateId: string): Promise<ConnectEventSnapshotRow[]>;
}
