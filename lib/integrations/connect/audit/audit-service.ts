import { randomUUID } from "crypto";
import type { ConnectAuditAction, ConnectAuditEntry } from "../types";
import type { EventHistoryStore } from "../history/event-history-store";
import { nowIso } from "../../utils/correlation";
import type { LoggingService } from "../../logging/LoggingService";
import type { ConnectEventStore } from "../event-store/connect-event-store";

export class AuditService {
  constructor(
    private readonly history: EventHistoryStore,
    private readonly logger: LoggingService,
    private readonly eventStore?: ConnectEventStore
  ) {}

  record(eventId: string, action: ConnectAuditAction, input?: { durationMs?: number; message?: string; metadata?: Record<string, unknown> }): ConnectAuditEntry {
    const entry: ConnectAuditEntry = {
      id: randomUUID(),
      action,
      timestamp: nowIso(),
      durationMs: input?.durationMs,
      message: input?.message,
      metadata: input?.metadata,
    };
    this.history.appendAudit(eventId, entry);
    this.logger.info("Connect audit recorded", {
      provider: "platform",
      correlationId: String(input?.metadata?.correlationId ?? "unknown"),
      event: `connect.audit.${action}`,
      metadata: { eventId, action, ...input?.metadata },
    });
    return entry;
  }

  received(eventId: string, metadata?: Record<string, unknown>): ConnectAuditEntry {
    return this.record(eventId, "received", { message: "Provider payload received", metadata });
  }

  validated(eventId: string, valid: boolean, metadata?: Record<string, unknown>): ConnectAuditEntry {
    return this.record(eventId, "validated", {
      message: valid ? "Validation passed" : "Validation failed",
      metadata: { ...metadata, valid },
    });
  }

  mapped(eventId: string, mapperUsed: string, metadata?: Record<string, unknown>): ConnectAuditEntry {
    return this.record(eventId, "mapped", {
      message: `Mapped via ${mapperUsed}`,
      metadata: { ...metadata, mapperUsed },
    });
  }

  published(eventId: string, busEventId: string, metadata?: Record<string, unknown>): ConnectAuditEntry {
    return this.record(eventId, "published", {
      message: "Published to event bus",
      metadata: { ...metadata, busEventId },
    });
  }

  consumed(eventId: string, metadata?: Record<string, unknown>): ConnectAuditEntry {
    return this.record(eventId, "consumed", { message: "Event consumed", metadata });
  }

  succeeded(eventId: string, durationMs?: number): ConnectAuditEntry {
    return this.record(eventId, "succeeded", { durationMs, message: "Pipeline completed" });
  }

  failed(eventId: string, message: string, metadata?: Record<string, unknown>): ConnectAuditEntry {
    return this.record(eventId, "failed", { message, metadata });
  }

  retried(eventId: string, metadata?: Record<string, unknown>): ConnectAuditEntry {
    return this.record(eventId, "retried", { message: "Event replay attempted", metadata });
  }

  getTrail(eventId: string): ConnectAuditEntry[] {
    return this.history.get(eventId)?.auditTrail ?? [];
  }

  async getTrailFromStore(correlationId: string): Promise<ConnectAuditEntry[]> {
    if (!this.eventStore) return [];
    const events = await this.eventStore.loadTimeline({ correlationId });
    return events.flatMap((event) => [
      {
        id: `${event.id}-received`,
        action: "received" as const,
        timestamp: event.occurredAt,
        message: event.eventType,
        metadata: { storedEventId: event.id, sequenceNumber: event.sequenceNumber },
      },
      {
        id: `${event.id}-mapped`,
        action: "mapped" as const,
        timestamp: event.recordedAt,
        message: event.providerEventType ?? event.eventType,
        metadata: { provider: event.provider },
      },
    ]);
  }
}
