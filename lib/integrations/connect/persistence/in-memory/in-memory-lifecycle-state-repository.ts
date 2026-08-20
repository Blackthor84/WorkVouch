import { randomUUID } from "crypto";
import { nowIso } from "../../../utils/correlation";
import type { LifecycleStateRecord } from "../../orchestration/types";
import type { LifecycleStateRepository } from "../repositories/lifecycle-state-repository";

export class InMemoryLifecycleStateRepository implements LifecycleStateRepository {
  private readonly rows = new Map<string, LifecycleStateRecord>();

  private key(connectionId: string, externalCandidateId: string): string {
    return `${connectionId}:${externalCandidateId}`;
  }

  async upsert(
    input: Omit<LifecycleStateRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }
  ): Promise<LifecycleStateRecord> {
    const existingKey = this.key(input.connectionId, input.externalCandidateId);
    const existing = this.rows.get(existingKey);
    const now = nowIso();
    const row: LifecycleStateRecord = {
      id: input.id ?? existing?.id ?? randomUUID(),
      connectionId: input.connectionId,
      employerAccountId: input.employerAccountId,
      externalCandidateId: input.externalCandidateId,
      state: input.state,
      previousState: input.previousState ?? existing?.state,
      lastEventType: input.lastEventType,
      lastDecision: input.lastDecision,
      metadata: input.metadata ?? {},
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.rows.set(existingKey, { ...row });
    return { ...row };
  }

  async getByCandidate(connectionId: string, externalCandidateId: string): Promise<LifecycleStateRecord | null> {
    const row = this.rows.get(this.key(connectionId, externalCandidateId));
    return row ? { ...row } : null;
  }

  async listByConnection(connectionId: string): Promise<LifecycleStateRecord[]> {
    return Array.from(this.rows.values())
      .filter((r) => r.connectionId === connectionId)
      .map((r) => ({ ...r }));
  }

  clear(): void {
    this.rows.clear();
  }
}
