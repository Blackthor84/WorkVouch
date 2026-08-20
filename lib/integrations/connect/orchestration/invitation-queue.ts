import { randomUUID } from "crypto";
import { nowIso } from "../../utils/correlation";
import type { InvitationQueueItem, InvitationQueueStatus } from "./types";

export interface EnqueueInvitationInput {
  connectionId: string;
  employerAccountId: string;
  externalCandidateId: string;
  candidateEmail: string;
  candidateName?: string;
  jobExternalId?: string;
  status?: InvitationQueueStatus;
  scheduledAt?: string;
  correlationId: string;
  ruleId?: string;
  metadata?: Record<string, unknown>;
}

/** In-memory invitation queue with retry support. */
export class InvitationQueue {
  private readonly items = new Map<string, InvitationQueueItem>();

  async enqueue(input: EnqueueInvitationInput): Promise<InvitationQueueItem> {
    const now = nowIso();
    const item: InvitationQueueItem = {
      id: randomUUID(),
      connectionId: input.connectionId,
      employerAccountId: input.employerAccountId,
      externalCandidateId: input.externalCandidateId,
      candidateEmail: input.candidateEmail,
      candidateName: input.candidateName,
      jobExternalId: input.jobExternalId,
      status: input.status ?? "pending",
      scheduledAt: input.scheduledAt,
      retryCount: 0,
      maxRetries: 3,
      correlationId: input.correlationId,
      ruleId: input.ruleId,
      metadata: input.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(item.id, { ...item });
    return { ...item };
  }

  async markSent(id: string): Promise<InvitationQueueItem | null> {
    return this.updateStatus(id, "sent", { sentAt: nowIso() });
  }

  async markFailed(id: string, error: string): Promise<InvitationQueueItem | null> {
    const row = this.items.get(id);
    if (!row) return null;
    const retryCount = row.retryCount + 1;
    const status: InvitationQueueStatus = retryCount >= row.maxRetries ? "failed" : "retry";
    return this.updateStatus(id, status, { retryCount, metadata: { ...row.metadata, lastError: error } });
  }

  async cancel(id: string): Promise<InvitationQueueItem | null> {
    return this.updateStatus(id, "cancelled");
  }

  async expire(id: string): Promise<InvitationQueueItem | null> {
    return this.updateStatus(id, "expired");
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
    const due: InvitationQueueItem[] = [];
    for (const item of this.items.values()) {
      if (item.status === "scheduled" && item.scheduledAt && new Date(item.scheduledAt).getTime() <= now) {
        const updated = await this.markSent(item.id);
        if (updated) due.push(updated);
      }
    }
    return due;
  }

  size(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  private async updateStatus(
    id: string,
    status: InvitationQueueStatus,
    extra?: Partial<InvitationQueueItem>
  ): Promise<InvitationQueueItem | null> {
    const row = this.items.get(id);
    if (!row) return null;
    const updated = { ...row, ...extra, status, updatedAt: nowIso() };
    this.items.set(id, updated);
    return { ...updated };
  }
}
