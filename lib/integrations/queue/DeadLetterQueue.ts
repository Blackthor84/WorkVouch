import type { IntegrationEvent } from "../types/events";
import type { LoggingService } from "../logging/LoggingService";

export class DeadLetterQueue {
  private readonly items: IntegrationEvent[] = [];

  constructor(private readonly logger: LoggingService) {}

  enqueue(event: IntegrationEvent): void {
    this.items.push({ ...event, status: "dead_letter" });
    this.logger.warn("DLQ item added", {
      provider: event.provider,
      correlationId: event.correlationId,
      event: event.type,
      companyId: event.employerAccountId,
      metadata: { eventId: event.id, lastError: event.lastError },
    });
  }

  list(): IntegrationEvent[] {
    return [...this.items];
  }

  replay(eventId: string): IntegrationEvent | undefined {
    const index = this.items.findIndex((item) => item.id === eventId);
    if (index === -1) return undefined;
    const [event] = this.items.splice(index, 1);
    return {
      ...event,
      status: "pending",
      attemptCount: 0,
      lastError: undefined,
      scheduledAt: new Date().toISOString(),
    };
  }

  size(): number {
    return this.items.length;
  }
}
