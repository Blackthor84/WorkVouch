import type { AtsProviderId } from "./common";

export type EventPriority = 0 | 1 | 2 | 3;

export type IntegrationEventStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "retry_scheduled"
  | "dead_letter";

export interface IntegrationEvent<TPayload = Record<string, unknown>> {
  id: string;
  type: string;
  provider: AtsProviderId;
  employerAccountId?: string;
  connectionId?: string;
  correlationId: string;
  priority: EventPriority;
  payload: TPayload;
  status: IntegrationEventStatus;
  attemptCount: number;
  maxAttempts: number;
  scheduledAt: string;
  createdAt: string;
  processedAt?: string;
  lastError?: string;
  idempotencyKey?: string;
}

export type EventHandler<TPayload = Record<string, unknown>> = (
  event: IntegrationEvent<TPayload>
) => Promise<void>;

export interface PublishEventInput<TPayload = Record<string, unknown>> {
  type: string;
  provider: AtsProviderId;
  payload: TPayload;
  employerAccountId?: string;
  connectionId?: string;
  correlationId?: string;
  priority?: EventPriority;
  idempotencyKey?: string;
  maxAttempts?: number;
}
