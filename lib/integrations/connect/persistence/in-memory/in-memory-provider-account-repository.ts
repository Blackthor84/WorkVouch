import { randomUUID } from "crypto";
import { nowIso } from "../../../utils/correlation";
import type { ConnectProviderAccountRow } from "../types";
import type { ProviderAccountRepository } from "../repositories/provider-account-repository";

export class InMemoryProviderAccountRepository implements ProviderAccountRepository {
  private readonly rows = new Map<string, ConnectProviderAccountRow>();

  private key(connectionId: string, externalAccountId: string): string {
    return `${connectionId}:${externalAccountId}`;
  }

  async upsert(input: Omit<ConnectProviderAccountRow, "id" | "createdAt" | "updatedAt">): Promise<ConnectProviderAccountRow> {
    const k = this.key(input.connectionId, input.externalAccountId);
    const now = nowIso();
    const saved: ConnectProviderAccountRow = {
      id: this.rows.get(k)?.id ?? randomUUID(),
      ...input,
      createdAt: this.rows.get(k)?.createdAt ?? now,
      updatedAt: now,
    };
    this.rows.set(k, saved);
    return { ...saved };
  }

  async getByExternalId(connectionId: string, externalAccountId: string): Promise<ConnectProviderAccountRow | null> {
    const row = this.rows.get(this.key(connectionId, externalAccountId));
    return row ? { ...row } : null;
  }

  async listByConnection(connectionId: string): Promise<ConnectProviderAccountRow[]> {
    return Array.from(this.rows.values()).filter((r) => r.connectionId === connectionId).map((r) => ({ ...r }));
  }

  clear(): void {
    this.rows.clear();
  }
}
