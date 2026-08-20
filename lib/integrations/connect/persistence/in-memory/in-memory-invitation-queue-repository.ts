import { randomUUID } from "crypto";
import { nowIso } from "../../../utils/correlation";
import type { InvitationQueueItem, InvitationQueueStatus } from "../../orchestration/types";
import type { InvitationQueueRepository } from "../repositories/invitation-queue-repository";

export class InMemoryInvitationQueueRepository implements InvitationQueueRepository {
  private readonly items = new Map<string, InvitationQueueItem>();

  async enqueue(
    input: Omit<InvitationQueueItem, "id" | "createdAt" | "updatedAt" | "retryCount" | "maxRetries" | "sentAt"> & {
      retryCount?: number;
      maxRetries?: number;
    }
  ): Promise<InvitationQueueItem> {
    const now = nowIso();
    const row: InvitationQueueItem = {
      id: randomUUID(),
      ...input,
      retryCount: input.retryCount ?? 0,
      maxRetries: input.maxRetries ?? 3,
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(row.id, { ...row });
    return { ...row };
  }

  async markSent(id: string): Promise<InvitationQueueItem | null> {
    return this.patch(id, { status: "sent", sentAt: nowIso() });
  }

  async markFailed(id: string, error: string): Promise<InvitationQueueItem | null> {
    const row = this.items.get(id);
    if (!row) return null;
    const retryCount = row.retryCount + 1;
    const status: InvitationQueueStatus = retryCount >= row.maxRetries ? "failed" : "retry";
    return this.patch(id, { status, retryCount, metadata: { ...row.metadata, lastError: error } });
  }

  async cancel(id: string): Promise<InvitationQueueItem | null> {
    return this.patch(id, { status: "cancelled" });
  }

  async expire(id: string): Promise<InvitationQueueItem | null> {
    return this.patch(id, { status: "expired" });
  }

  async getById(id: string): Promise<InvitationQueueItem | null> {
    const row = this.items.get(id);
    return row ? { ...row } : null;
  }

  async listByConnection(connectionId: string, status?: InvitationQueueStatus): Promise<InvitationQueueItem[]> {
    return Array.from(this.items.values())
      .filter((r) => r.connectionId === connectionId && (!status || r.status === status))
      .map((r) => ({ ...r }));
  }

  async listByCandidate(
    connectionId: string,
    externalCandidateId: string,
    status?: InvitationQueueStatus
  ): Promise<InvitationQueueItem[]> {
    return Array.from(this.items.values())
      .filter(
        (r) =>
          r.connectionId === connectionId &&
          r.externalCandidateId === externalCandidateId &&
          (!status || r.status === status)
      )
      .map((r) => ({ ...r }));
  }

  async processDueScheduled(): Promise<InvitationQueueItem[]> {
    const now = Date.now();
    const processed: InvitationQueueItem[] = [];
    for (const item of this.items.values()) {
      if (item.status === "scheduled" && item.scheduledAt && new Date(item.scheduledAt).getTime() <= now) {
        const updated = await this.markSent(item.id);
        if (updated) processed.push(updated);
      }
    }
    return processed;
  }

  clear(): void {
    this.items.clear();
  }

  private patch(id: string, patch: Partial<InvitationQueueItem>): InvitationQueueItem | null {
    const row = this.items.get(id);
    if (!row) return null;
    const updated = { ...row, ...patch, updatedAt: nowIso() };
    this.items.set(id, updated);
    return { ...updated };
  }
}
