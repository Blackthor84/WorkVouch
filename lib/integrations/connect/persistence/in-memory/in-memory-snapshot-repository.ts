import { randomUUID } from "crypto";
import { nowIso } from "../../../utils/correlation";
import type { ConnectEventSnapshotRow } from "../types";
import type { SnapshotRepository } from "../repositories/snapshot-repository";

export class InMemorySnapshotRepository implements SnapshotRepository {
  private readonly rows = new Map<string, ConnectEventSnapshotRow>();

  private key(aggregateType: string, aggregateId: string, sequenceNumber: number): string {
    return `${aggregateType}:${aggregateId}:${sequenceNumber}`;
  }

  async save(row: Omit<ConnectEventSnapshotRow, "id" | "createdAt"> & { id?: string }): Promise<ConnectEventSnapshotRow> {
    const saved: ConnectEventSnapshotRow = {
      id: row.id ?? randomUUID(),
      aggregateType: row.aggregateType,
      aggregateId: row.aggregateId,
      sequenceNumber: row.sequenceNumber,
      state: { ...row.state },
      eventCount: row.eventCount,
      snapshotType: row.snapshotType,
      createdAt: nowIso(),
    };
    this.rows.set(this.key(row.aggregateType, row.aggregateId, row.sequenceNumber), saved);
    return { ...saved, state: { ...saved.state } };
  }

  async getLatest(aggregateType: string, aggregateId: string): Promise<ConnectEventSnapshotRow | null> {
    const matches = Array.from(this.rows.values())
      .filter((r) => r.aggregateType === aggregateType && r.aggregateId === aggregateId)
      .sort((a, b) => b.sequenceNumber - a.sequenceNumber);
    const latest = matches[0];
    return latest ? { ...latest, state: { ...latest.state } } : null;
  }

  async getBySequence(aggregateType: string, aggregateId: string, sequenceNumber: number): Promise<ConnectEventSnapshotRow | null> {
    const row = this.rows.get(this.key(aggregateType, aggregateId, sequenceNumber));
    return row ? { ...row, state: { ...row.state } } : null;
  }

  async list(aggregateType: string, aggregateId: string): Promise<ConnectEventSnapshotRow[]> {
    return Array.from(this.rows.values())
      .filter((r) => r.aggregateType === aggregateType && r.aggregateId === aggregateId)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      .map((r) => ({ ...r, state: { ...r.state } }));
  }

  clear(): void {
    this.rows.clear();
  }
}
