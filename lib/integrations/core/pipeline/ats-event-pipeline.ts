import type { EventDispatcher } from "../../events/EventDispatcher";
import type { LoggingService } from "../../logging/LoggingService";
import type { AtsProviderId } from "../../types/common";
import type { AtsEventEnvelope, AtsEventType } from "../events/ats-event-types";
import { EventValidator, mergeValidationResults, validationMessages } from "../validation/event-validator";
import { createCorrelationId, nowIso } from "../../utils/correlation";

export interface PublishUniversalEventInput<TEntity> {
  universalEvent: AtsEventType;
  providerEvent: string;
  provider: AtsProviderId;
  mapperUsed: string;
  employerAccountId: string;
  connectionId: string;
  correlationId?: string;
  entity: TEntity;
  validation: ReturnType<EventValidator["validateCandidate"]>;
  durationMs: number;
  idempotencyKey?: string;
  eventId?: string;
  sequenceNumber?: number;
}

export interface PublishUniversalEventResult {
  published: boolean;
  eventId?: string;
  validation: ReturnType<EventValidator["validateCandidate"]>;
  reason?: string;
}

/** Platform pipeline — publishes validated universal models to the Event Bus. */
export class AtsEventPipeline {
  constructor(
    private readonly dispatcher: EventDispatcher,
    private readonly logger: LoggingService,
    private readonly validator: EventValidator = new EventValidator()
  ) {}

  publish<TEntity>(input: PublishUniversalEventInput<TEntity>): PublishUniversalEventResult {
    const correlationId = input.correlationId ?? createCorrelationId("pipe");
    const started = Date.now();

    const typeValidation = this.validator.validateEventType(input.universalEvent);
    const contextValidation = this.validator.validateEventContext({
      eventId: input.eventId ?? input.idempotencyKey,
      eventType: input.universalEvent,
      sequenceNumber: input.sequenceNumber,
    });
    const merged = mergeValidationResults(typeValidation, contextValidation, input.validation);
    const messages = validationMessages(merged);

    const envelope: AtsEventEnvelope<TEntity> = {
      universalEvent: input.universalEvent,
      providerEvent: input.providerEvent,
      mapperUsed: input.mapperUsed,
      employerAccountId: input.employerAccountId,
      connectionId: input.connectionId,
      correlationId,
      translatedAt: nowIso(),
      durationMs: input.durationMs,
      validation: {
        valid: merged.valid,
        errors: messages.errors,
        warnings: messages.warnings,
      },
      entity: input.entity,
    };

    this.logger.info(
      "ATS event translated",
      {
        provider: input.provider,
        correlationId,
        companyId: input.employerAccountId,
        event: input.universalEvent,
      },
      {
        providerEvent: input.providerEvent,
        universalEvent: input.universalEvent,
        mapperUsed: input.mapperUsed,
        validationResult: merged.valid ? "valid" : "invalid",
        durationMs: input.durationMs,
        errors: messages.errors,
        warnings: messages.warnings,
      }
    );

    if (!merged.valid) {
      this.logger.warn(
        "ATS event rejected by validation",
        {
          provider: input.provider,
          correlationId,
          companyId: input.employerAccountId,
          event: input.universalEvent,
        },
        { errors: messages.errors }
      );
      return { published: false, validation: merged, reason: messages.errors.join("; ") };
    }

    const event = this.dispatcher.publish({
      type: input.universalEvent,
      provider: input.provider,
      payload: envelope,
      employerAccountId: input.employerAccountId,
      connectionId: input.connectionId,
      correlationId,
      idempotencyKey: input.idempotencyKey,
    });

    this.logger.info(
      "ATS event published to bus",
      {
        provider: input.provider,
        correlationId,
        companyId: input.employerAccountId,
        event: input.universalEvent,
      },
      {
        providerEvent: input.providerEvent,
        universalEvent: input.universalEvent,
        mapperUsed: input.mapperUsed,
        validationResult: "valid",
        eventBusId: event.id,
        durationMs: Date.now() - started,
      }
    );

    return { published: true, eventId: event.id, validation: merged };
  }

  getValidator(): EventValidator {
    return this.validator;
  }
}
