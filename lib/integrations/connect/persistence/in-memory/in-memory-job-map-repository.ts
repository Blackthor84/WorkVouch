import { randomUUID } from "crypto";
import { nowIso } from "../../../utils/correlation";
import type { ConnectJobMapRow } from "../types";
import type { JobMapRepository } from "../repositories/job-map-repository";

export class InMemoryJobMapRepository implements JobMapRepository {
  private readonly rows = new Map<string, ConnectJobMapRow>();

  private key(connectionId: string, externalJobId: string): string {
    return `${connectionId}:${externalJobId}`;
  }

  async upsert(input: Omit<ConnectJobMapRow, "id" | "createdAt" | "updatedAt">): Promise<ConnectJobMapRow> {
    const k = this.key(input.connectionId, input.externalJobId);
    const existing = this.rows.get(k);
    const now = nowIso();
    const row: ConnectJobMapRow = existing
      ? { ...existing, ...input, updatedAt: now }
      : { id: randomUUID(), ...input, createdAt: now, updatedAt: now };
    this.rows.set(k, row);
    return { ...row };
  }

  async getByExternalId(connectionId: string, externalJobId: string): Promise<ConnectJobMapRow | null> {
    const row = this.rows.get(this.key(connectionId, externalJobId));
    return row ? { ...row } : null;
  }

  async listByConnection(connectionId: string): Promise<ConnectJobMapRow[]> {
    return Array.from(this.rows.values())
      .filter((r) => r.connectionId === connectionId)
      .map((r) => ({ ...r }));
  }

  clear(): void {
    this.rows.clear();
  }
}
