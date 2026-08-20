import { randomUUID } from "crypto";
import type {
  EventHandler,
  IntegrationEvent,
  PublishEventInput,
} from "../types/events";
import type { LoggingService } from "../logging/LoggingService";
import type { ConfigurationService } from "../config/ConfigurationService";
import { createCorrelationId, nowIso } from "../utils/correlation";
import type { RetryService } from "../queue/RetryService";
import type { DeadLetterQueue } from "../queue/DeadLetterQueue";

export class EventDispatcher {
  private readonly handlers = new Map<string, EventHandler[]>();
  private readonly events = new Map<string, IntegrationEvent>();
  private readonly idempotencyKeys = new Set<string>();

  constructor(
    private readonly logger: LoggingService,
    private readonly config: ConfigurationService,
    private readonly retryService: RetryService,
    private readonly deadLetterQueue: DeadLetterQueue
  ) {}

  subscribe<TPayload = Record<string, unknown>>(
    eventType: string,
    handler: EventHandler<TPayload>
  ): () => void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(eventType, existing);

    return () => {
      const handlers = this.handlers.get(eventType) ?? [];
      this.handlers.set(
        eventType,
        handlers.filter((item) => item !== handler)
      );
    };
  }

  publish<TPayload = Record<string, unknown>>(
    input: PublishEventInput<TPayload>
  ): IntegrationEvent<TPayload> {
    const platformConfig = this.config.getConfig();

    if (input.idempotencyKey) {
      const key = `${input.provider}:${input.idempotencyKey}`;
      if (this.idempotencyKeys.has(key)) {
        const existing = Array.from(this.events.values()).find(
          (event) => event.idempotencyKey === input.idempotencyKey
        );
        if (existing) return existing as IntegrationEvent<TPayload>;
      }
      this.idempotencyKeys.add(key);
    }

    const event: IntegrationEvent<TPayload> = {
      id: randomUUID(),
      type: input.type,
      provider: input.provider,
      employerAccountId: input.employerAccountId,
      connectionId: input.connectionId,
      correlationId: input.correlationId ?? createCorrelationId("evt"),
      priority: input.priority ?? 2,
      payload: input.payload,
      status: "pending",
      attemptCount: 0,
      maxAttempts: input.maxAttempts ?? platformConfig.defaultEventMaxAttempts,
      scheduledAt: nowIso(),
      createdAt: nowIso(),
      idempotencyKey: input.idempotencyKey,
    };

    this.events.set(event.id, event);
    this.logger.info("Event published", {
      provider: input.provider,
      correlationId: event.correlationId,
      event: input.type,
      companyId: input.employerAccountId,
    });

    void this.processEvent(event.id);
    return event;
  }

  async processEvent(eventId: string): Promise<void> {
    const event = this.events.get(eventId);
    if (!event || event.status === "completed" || event.status === "dead_letter") {
      return;
    }

    const handlers = this.handlers.get(event.type) ?? [];
    if (handlers.length === 0) {
      event.status = "completed";
      event.processedAt = nowIso();
      return;
    }

    event.status = "processing";
    event.attemptCount += 1;
    const started = Date.now();

    try {
      for (const handler of handlers) {
        await handler(event);
      }
      event.status = "completed";
      event.processedAt = nowIso();
      this.logger.info("Event processed", {
        provider: event.provider,
        correlationId: event.correlationId,
        event: event.type,
        companyId: event.employerAccountId,
        metadata: { durationMs: Date.now() - started },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown event error";
      event.lastError = message;

      if (event.attemptCount >= event.maxAttempts) {
        event.status = "dead_letter";
        this.deadLetterQueue.enqueue(event);
        this.logger.error("Event moved to DLQ", {
          provider: event.provider,
          correlationId: event.correlationId,
          event: event.type,
          companyId: event.employerAccountId,
        });
        return;
      }

      event.status = "retry_scheduled";
      const delayMs = this.retryService.getBackoffMs(event.attemptCount);
      event.scheduledAt = new Date(Date.now() + delayMs).toISOString();
      this.logger.warn("Event scheduled for retry", {
        provider: event.provider,
        correlationId: event.correlationId,
        event: event.type,
        companyId: event.employerAccountId,
        metadata: { attemptCount: event.attemptCount, delayMs },
      });

      setTimeout(() => {
        void this.processEvent(event.id);
      }, delayMs);
    }
  }

  getEvent(eventId: string): IntegrationEvent | undefined {
    return this.events.get(eventId);
  }

  listEvents(status?: IntegrationEvent["status"]): IntegrationEvent[] {
    const all = Array.from(this.events.values());
    if (!status) return all;
    return all.filter((event) => event.status === status);
  }
}
