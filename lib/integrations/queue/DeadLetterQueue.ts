import type { IntegrationEvent } from "../types/events";
import type { LoggingService } from "../logging/LoggingService";
import type { DeadLetterStore } from "./dead-letter-store";
import { InMemoryDeadLetterStore } from "./in-memory-dead-letter-store";
import { dlqRecordToIntegrationEvent } from "./supabase-dead-letter-store";

/**
 * Dead letter queue — in-memory for tests, Supabase-backed in production.
 * Enqueue persists when a DeadLetterStore is provided.
 */
export class DeadLetterQueue {
  private readonly items: IntegrationEvent[] = [];

  constructor(
    private readonly logger: LoggingService,
    private readonly store?: DeadLetterStore
  ) {}

  enqueue(
    event: IntegrationEvent,
    options?: { sourceType?: "webhook" | "event"; failureReason?: string }
  ): void {
    const stored = { ...event, status: "dead_letter" as const };
    this.items.push(stored);
    this.logger.warn("DLQ item added", {
      provider: event.provider,
      correlationId: event.correlationId,
      event: event.type,
      companyId: event.employerAccountId,
      metadata: {
        eventId: event.id,
        lastError: event.lastError,
        connectionId: event.connectionId,
      },
    });

    if (this.store) {
      void this.store.enqueue(event, options).catch((err) => {
        this.logger.error("DLQ persist failed", {
          provider: event.provider,
          correlationId: event.correlationId,
          event: event.type,
          metadata: { error: err instanceof Error ? err.message : String(err) },
        });
      });
    }
  }

  list(): IntegrationEvent[] {
    return [...this.items];
  }

  replay(eventId: string): IntegrationEvent | undefined {
    const index = this.items.findIndex((item) => item.id === eventId);
    if (index !== -1) {
      const [event] = this.items.splice(index, 1);
      if (this.store) {
        void this.store.markResolved(eventId).catch(() => null);
      }
      return {
        ...event,
        status: "pending",
        attemptCount: 0,
        lastError: undefined,
        scheduledAt: new Date().toISOString(),
      };
    }
    return undefined;
  }

  /** Async replay — checks Supabase when not in memory. */
  async replayAsync(eventId: string): Promise<IntegrationEvent | null> {
    const fromMemory = this.replay(eventId);
    if (fromMemory) return fromMemory;

    if (!this.store) return null;
    const record = await this.store.getById(eventId);
    if (!record || record.resolutionStatus === "resolved") return null;
    await this.store.markResolved(eventId);
    return dlqRecordToIntegrationEvent(record);
  }

  size(): number {
    return this.items.length;
  }

  async sizeAsync(): Promise<number> {
    if (this.store) {
      try {
        return await this.store.size();
      } catch {
        return this.items.length;
      }
    }
    return this.items.length;
  }

  async listPendingFromStore(connectionId?: string): Promise<IntegrationEvent[]> {
    if (!this.store) return this.list();
    const rows = await this.store.list({ connectionId, resolutionStatus: "pending" });
    return rows.map(dlqRecordToIntegrationEvent);
  }
}

export function createDeadLetterQueue(
  logger: LoggingService,
  store?: DeadLetterStore
): DeadLetterQueue {
  return new DeadLetterQueue(logger, store);
}

export { InMemoryDeadLetterStore };
