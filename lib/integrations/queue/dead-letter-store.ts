import type { IntegrationEvent } from "../types/events";

export type DlqResolutionStatus = "pending" | "resolved" | "abandoned";

export interface DeadLetterRecord {
  id: string;
  sourceType: "webhook" | "event";
  sourceId?: string;
  connectionId?: string;
  employerAccountId?: string;
  provider: string;
  correlationId: string;
  eventType: string;
  payload: Record<string, unknown>;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  resolutionStatus: DlqResolutionStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface DeadLetterStore {
  enqueue(event: IntegrationEvent, options?: { sourceType?: "webhook" | "event"; failureReason?: string }): Promise<DeadLetterRecord>;
  getById(id: string): Promise<DeadLetterRecord | null>;
  list(options?: {
    connectionId?: string;
    resolutionStatus?: DlqResolutionStatus;
    correlationId?: string;
    limit?: number;
  }): Promise<DeadLetterRecord[]>;
  markResolved(id: string): Promise<DeadLetterRecord | null>;
  incrementRetry(id: string, error?: string): Promise<DeadLetterRecord | null>;
  size(): Promise<number>;
}

export function integrationEventToDlqRecord(
  event: IntegrationEvent,
  options?: { sourceType?: "webhook" | "event"; failureReason?: string }
): Omit<DeadLetterRecord, "createdAt" | "updatedAt"> {
  return {
    id: event.id,
    sourceType: options?.sourceType ?? "event",
    sourceId: event.id,
    connectionId: event.connectionId,
    employerAccountId: event.employerAccountId,
    provider: event.provider,
    correlationId: event.correlationId,
    eventType: event.type,
    payload: event.payload as Record<string, unknown>,
    failureReason: options?.failureReason ?? event.lastError,
    retryCount: event.attemptCount,
    maxRetries: event.maxAttempts,
    resolutionStatus: "pending",
  };
}

export function dlqRecordToIntegrationEvent(record: DeadLetterRecord): IntegrationEvent {
  return {
    id: record.id,
    type: record.eventType,
    provider: record.provider as IntegrationEvent["provider"],
    employerAccountId: record.employerAccountId,
    connectionId: record.connectionId,
    correlationId: record.correlationId,
    priority: 1,
    payload: record.payload,
    status: "pending",
    attemptCount: 0,
    maxAttempts: record.maxRetries,
    scheduledAt: new Date().toISOString(),
    createdAt: record.createdAt,
    lastError: record.failureReason,
  };
}
