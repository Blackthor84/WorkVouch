import { randomUUID } from "crypto";
import type { ConnectOAuthStateRecord } from "../../auth/types";
import type { OAuthStateRepository } from "../repositories/oauth-state-repository";

export class InMemoryOAuthStateRepository implements OAuthStateRepository {
  private readonly states = new Map<string, ConnectOAuthStateRecord>();

  async save(record: ConnectOAuthStateRecord): Promise<void> {
    this.states.set(record.state, { ...record });
  }

  async consume(state: string): Promise<ConnectOAuthStateRecord | null> {
    const entry = this.states.get(state);
    if (!entry) return null;
    this.states.delete(state);
    if (new Date(entry.expiresAt).getTime() < Date.now()) return null;
    return { ...entry };
  }

  async purgeExpired(): Promise<number> {
    const now = Date.now();
    let removed = 0;
    for (const [key, value] of this.states.entries()) {
      if (new Date(value.expiresAt).getTime() < now) {
        this.states.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  async findByConnectionId(connectionId: string): Promise<ConnectOAuthStateRecord | null> {
    const entry = Array.from(this.states.values()).find((s) => s.connectionId === connectionId);
    return entry ? { ...entry } : null;
  }

  clear(): void {
    this.states.clear();
  }
}
