import type { IntegrationEvent } from "../types/events";
import type {
  DeadLetterRecord,
  DeadLetterStore,
  DlqResolutionStatus,
} from "./dead-letter-store";
import { integrationEventToDlqRecord } from "./dead-letter-store";

export class InMemoryDeadLetterStore implements DeadLetterStore {
  private readonly items = new Map<string, DeadLetterRecord>();

  async enqueue(
    event: IntegrationEvent,
    options?: { sourceType?: "webhook" | "event"; failureReason?: string }
  ): Promise<DeadLetterRecord> {
    const now = new Date().toISOString();
    const record: DeadLetterRecord = {
      ...integrationEventToDlqRecord(event, options),
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(record.id, record);
    return record;
  }

  async getById(id: string): Promise<DeadLetterRecord | null> {
    return this.items.get(id) ?? null;
  }

  async list(options?: {
    connectionId?: string;
    resolutionStatus?: DlqResolutionStatus;
    correlationId?: string;
    limit?: number;
  }): Promise<DeadLetterRecord[]> {
    let rows = Array.from(this.items.values());
    if (options?.connectionId) rows = rows.filter((r) => r.connectionId === options.connectionId);
    if (options?.resolutionStatus) {
      rows = rows.filter((r) => r.resolutionStatus === options.resolutionStatus);
    }
    if (options?.correlationId) rows = rows.filter((r) => r.correlationId === options.correlationId);
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return rows.slice(0, options?.limit ?? 50);
  }

  async markResolved(id: string): Promise<DeadLetterRecord | null> {
    const row = this.items.get(id);
    if (!row) return null;
    const updated: DeadLetterRecord = {
      ...row,
      resolutionStatus: "resolved",
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.items.set(id, updated);
    return updated;
  }

  async incrementRetry(id: string, error?: string): Promise<DeadLetterRecord | null> {
    const row = this.items.get(id);
    if (!row) return null;
    const updated: DeadLetterRecord = {
      ...row,
      retryCount: row.retryCount + 1,
      failureReason: error ?? row.failureReason,
      updatedAt: new Date().toISOString(),
    };
    this.items.set(id, updated);
    return updated;
  }

  async size(): Promise<number> {
    return [...this.items.values()].filter((r) => r.resolutionStatus === "pending").length;
  }
}
