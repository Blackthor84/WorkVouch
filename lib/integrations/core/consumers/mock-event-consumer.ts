import type { IntegrationEvent } from "../../types/events";
import type { LoggingService } from "../../logging/LoggingService";
import type { AtsEventEnvelope } from "../events/ats-event-types";
import { isAtsEventType } from "../events/ats-event-types";

export interface MockConsumerRecord {
  event: IntegrationEvent<AtsEventEnvelope>;
  receivedAt: string;
  schemaValid: boolean;
  schemaErrors: string[];
}

/** Mock consumer for in-memory pipeline testing — no persistence. */
export class MockEventConsumer {
  private readonly records: MockConsumerRecord[] = [];

  constructor(private readonly logger: LoggingService) {}

  subscribe(unsubscribe: () => void): () => void {
    return unsubscribe;
  }

  createHandler(): (event: IntegrationEvent<AtsEventEnvelope>) => Promise<void> {
    return async (event) => {
      const validation = this.validateSchema(event.payload);
      const record: MockConsumerRecord = {
        event,
        receivedAt: new Date().toISOString(),
        schemaValid: validation.valid,
        schemaErrors: validation.errors,
      };
      this.records.push(record);

      this.logger.info(
        "Mock consumer received ATS event",
        {
          provider: event.provider,
          correlationId: event.correlationId,
          companyId: event.employerAccountId,
          event: event.type,
        },
        {
          providerEvent: event.payload.providerEvent,
          universalEvent: event.payload.universalEvent,
          mapperUsed: event.payload.mapperUsed,
          validationResult: event.payload.validation.valid ? "valid" : "invalid",
          durationMs: event.payload.durationMs,
          schemaValid: validation.valid,
        }
      );
    };
  }

  getRecords(): MockConsumerRecord[] {
    return [...this.records];
  }

  clear(): void {
    this.records.length = 0;
  }

  private validateSchema(payload: AtsEventEnvelope): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!payload.universalEvent || !isAtsEventType(payload.universalEvent)) {
      errors.push("Missing or invalid universalEvent");
    }
    if (!payload.providerEvent) errors.push("Missing providerEvent");
    if (!payload.mapperUsed) errors.push("Missing mapperUsed");
    if (!payload.employerAccountId) errors.push("Missing employerAccountId");
    if (!payload.connectionId) errors.push("Missing connectionId");
    if (!payload.correlationId) errors.push("Missing correlationId");
    if (!payload.entity) errors.push("Missing entity");
    if (!payload.validation) errors.push("Missing validation block");
    return { valid: errors.length === 0, errors };
  }
}
