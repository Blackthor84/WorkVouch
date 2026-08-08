import type { InvitationQueueItem, InvitationQueueStatus } from "../../orchestration/types";

export interface InvitationQueueRepository {
  enqueue(input: Omit<InvitationQueueItem, "id" | "createdAt" | "updatedAt" | "retryCount" | "maxRetries" | "sentAt"> & {
    retryCount?: number;
    maxRetries?: number;
  }): Promise<InvitationQueueItem>;
  markSent(id: string): Promise<InvitationQueueItem | null>;
  markFailed(id: string, error: string): Promise<InvitationQueueItem | null>;
  cancel(id: string): Promise<InvitationQueueItem | null>;
  expire(id: string): Promise<InvitationQueueItem | null>;
  getById(id: string): Promise<InvitationQueueItem | null>;
  listByConnection(connectionId: string, status?: InvitationQueueStatus): Promise<InvitationQueueItem[]>;
  listByCandidate(connectionId: string, externalCandidateId: string, status?: InvitationQueueStatus): Promise<InvitationQueueItem[]>;
  processDueScheduled(): Promise<InvitationQueueItem[]>;
}
