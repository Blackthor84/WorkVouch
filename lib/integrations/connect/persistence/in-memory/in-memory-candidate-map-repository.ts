import { randomUUID } from "crypto";
import { nowIso } from "../../../utils/correlation";
import type { ConnectCandidateMapRow } from "../types";
import type { CandidateMapRepository } from "../repositories/candidate-map-repository";

export class InMemoryCandidateMapRepository implements CandidateMapRepository {
  private readonly rows = new Map<string, ConnectCandidateMapRow>();

  private key(connectionId: string, externalCandidateId: string): string {
    return `${connectionId}:${externalCandidateId}`;
  }

  async upsert(input: Omit<ConnectCandidateMapRow, "id" | "createdAt" | "updatedAt">): Promise<ConnectCandidateMapRow> {
    const k = this.key(input.connectionId, input.externalCandidateId);
    const existing = this.rows.get(k);
    const now = nowIso();
    const row: ConnectCandidateMapRow = existing
      ? { ...existing, ...input, updatedAt: now }
      : { id: randomUUID(), ...input, createdAt: now, updatedAt: now };
    this.rows.set(k, row);
    return { ...row };
  }

  async getByExternalId(connectionId: string, externalCandidateId: string): Promise<ConnectCandidateMapRow | null> {
    const row = this.rows.get(this.key(connectionId, externalCandidateId));
    return row ? { ...row } : null;
  }

  async listByConnection(connectionId: string): Promise<ConnectCandidateMapRow[]> {
    return Array.from(this.rows.values())
      .filter((r) => r.connectionId === connectionId)
      .map((r) => ({ ...r }));
  }

  clear(): void {
    this.rows.clear();
  }
}
