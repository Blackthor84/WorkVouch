import { randomUUID } from "crypto";
import { nowIso } from "../../../utils/correlation";
import type { ConnectConnectionRow } from "../types";
import type { ConnectionRepository } from "../repositories/connection-repository";

export class InMemoryConnectionRepository implements ConnectionRepository {
  private readonly rows = new Map<string, ConnectConnectionRow>();

  async create(input: Omit<ConnectConnectionRow, "id" | "createdAt" | "updatedAt">): Promise<ConnectConnectionRow> {
    const now = nowIso();
    const row: ConnectConnectionRow = { id: randomUUID(), ...input, createdAt: now, updatedAt: now };
    this.rows.set(row.id, row);
    return { ...row };
  }

  async getById(id: string): Promise<ConnectConnectionRow | null> {
    const row = this.rows.get(id);
    return row ? { ...row } : null;
  }

  async findByEmployerAndProvider(employerAccountId: string, provider: ConnectConnectionRow["provider"]): Promise<ConnectConnectionRow | null> {
    const row = Array.from(this.rows.values()).find(
      (r) => r.employerAccountId === employerAccountId && r.provider === provider
    );
    return row ? { ...row } : null;
  }

  async updateStatus(id: string, status: string, metadata?: Record<string, unknown>): Promise<ConnectConnectionRow | null> {
    const row = this.rows.get(id);
    if (!row) return null;
    const updated = { ...row, status, metadata: metadata ?? row.metadata, updatedAt: nowIso() };
    this.rows.set(id, updated);
    return { ...updated };
  }

  async listByEmployer(employerAccountId: string): Promise<ConnectConnectionRow[]> {
    return Array.from(this.rows.values())
      .filter((r) => r.employerAccountId === employerAccountId)
      .map((r) => ({ ...r }));
  }

  clear(): void {
    this.rows.clear();
  }
}
