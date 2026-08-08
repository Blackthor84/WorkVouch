import type { ConnectProjectionStateRow } from "../types";

export interface ProjectionRepository {
  get(aggregateType: string, aggregateId: string, projectionName: string): Promise<ConnectProjectionStateRow | null>;
  save(row: Omit<ConnectProjectionStateRow, "id" | "updatedAt"> & { id?: string }): Promise<ConnectProjectionStateRow>;
  listByAggregate(aggregateType: string, aggregateId: string): Promise<ConnectProjectionStateRow[]>;
}
