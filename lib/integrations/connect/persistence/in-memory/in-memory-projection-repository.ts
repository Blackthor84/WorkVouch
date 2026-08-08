import { randomUUID } from "crypto";
import { nowIso } from "../../../utils/correlation";
import type { ConnectProjectionStateRow } from "../types";
import type { ProjectionRepository } from "../repositories/projection-repository";

export class InMemoryProjectionRepository implements ProjectionRepository {
  private readonly rows = new Map<string, ConnectProjectionStateRow>();

  private key(aggregateType: string, aggregateId: string, projectionName: string): string {
    return `${aggregateType}:${aggregateId}:${projectionName}`;
  }

  async get(aggregateType: string, aggregateId: string, projectionName: string): Promise<ConnectProjectionStateRow | null> {
    const row = this.rows.get(this.key(aggregateType, aggregateId, projectionName));
    return row ? { ...row, state: { ...row.state } } : null;
  }

  async save(row: Omit<ConnectProjectionStateRow, "id" | "updatedAt"> & { id?: string }): Promise<ConnectProjectionStateRow> {
    const k = this.key(row.aggregateType, row.aggregateId, row.projectionName);
    const saved: ConnectProjectionStateRow = {
      id: row.id ?? this.rows.get(k)?.id ?? randomUUID(),
      aggregateType: row.aggregateType,
      aggregateId: row.aggregateId,
      projectionName: row.projectionName,
      sequenceNumber: row.sequenceNumber,
      state: { ...row.state },
      updatedAt: nowIso(),
    };
    this.rows.set(k, saved);
    return { ...saved, state: { ...saved.state } };
  }

  async listByAggregate(aggregateType: string, aggregateId: string): Promise<ConnectProjectionStateRow[]> {
    return Array.from(this.rows.values())
      .filter((r) => r.aggregateType === aggregateType && r.aggregateId === aggregateId)
      .map((r) => ({ ...r, state: { ...r.state } }));
  }

  clear(): void {
    this.rows.clear();
  }
}
