import type { AtsEventPipeline, PublishUniversalEventResult } from "../../../core/pipeline/ats-event-pipeline";
import type { EventValidator } from "../../../core/validation/event-validator";
import { ATS_EVENT_TYPES } from "../../../core/events/ats-event-types";
import { createCorrelationId } from "../../../utils/correlation";
import {
  mapGreenhouseApplication,
  mapGreenhouseApplicationFromAction,
  mapGreenhouseCandidate,
  mapGreenhouseJob,
  mapGreenhouseOfferApplication,
  parseGreenhouseApplication,
  parseGreenhouseCandidate,
  parseGreenhouseJob,
  parseGreenhouseOffer,
} from "../mappers";
import {
  buildIdempotencyKey,
  mapGreenhouseWebhookEnvelope,
  parseGreenhouseWebhook,
  routeGreenhouseWebhook,
} from "../mappers/webhookMapper";

export interface TranslateGreenhouseEventInput {
  rawPayload: unknown;
  employerAccountId: string;
  connectionId: string;
  correlationId?: string;
  sequenceNumber?: number;
}

export interface TranslateGreenhouseEventResult extends PublishUniversalEventResult {
  universalEvent?: string;
  providerEvent?: string;
  mapperUsed?: string;
  correlationId: string;
  durationMs: number;
}

/** Translates Greenhouse webhook payloads into universal ATS events and publishes to the bus. */
export class GreenhouseEventTranslator {
  constructor(
    private readonly pipeline: AtsEventPipeline,
    private readonly validator: EventValidator
  ) {}

  translateAndPublish(input: TranslateGreenhouseEventInput): TranslateGreenhouseEventResult {
    const started = Date.now();
    const correlationId = input.correlationId ?? createCorrelationId("gh");

    try {
      const webhook = parseGreenhouseWebhook(input.rawPayload);
      const route = routeGreenhouseWebhook(webhook.action);
      if (!route) {
        return {
          published: false,
          correlationId,
          durationMs: Date.now() - started,
          validation: {
            valid: false,
            errors: [
              {
                code: "MALFORMED_PAYLOAD",
                message: `Unsupported Greenhouse action: ${webhook.action}`,
              },
            ],
            warnings: [],
          },
          reason: `Unsupported Greenhouse action: ${webhook.action}`,
        };
      }

      const envelope = mapGreenhouseWebhookEnvelope(webhook, new Date().toISOString());
      const idempotencyKey = buildIdempotencyKey(webhook);

      switch (route.universalEvent) {
        case ATS_EVENT_TYPES.CandidateCreated:
        case ATS_EVENT_TYPES.CandidateUpdated: {
          const candidate = mapGreenhouseCandidate(parseGreenhouseCandidate(webhook.payload));
          const validation = this.validator.validateCandidate(candidate);
          const result = this.pipeline.publish({
            universalEvent: route.universalEvent,
            providerEvent: route.providerEvent,
            provider: "greenhouse",
            mapperUsed: route.mapperUsed,
            employerAccountId: input.employerAccountId,
            connectionId: input.connectionId,
            correlationId,
            entity: { candidate, webhook: envelope },
            validation,
            durationMs: Date.now() - started,
            idempotencyKey,
            eventId: envelope.eventId,
            sequenceNumber: input.sequenceNumber,
          });
          return { ...result, universalEvent: route.universalEvent, providerEvent: route.providerEvent, mapperUsed: route.mapperUsed, correlationId, durationMs: Date.now() - started };
        }

        case ATS_EVENT_TYPES.ApplicationCreated:
        case ATS_EVENT_TYPES.CandidateMoved: {
          const application = mapGreenhouseApplication(parseGreenhouseApplication(webhook.payload));
          const validation = this.validator.validateApplication(application);
          const result = this.pipeline.publish({
            universalEvent: route.universalEvent,
            providerEvent: route.providerEvent,
            provider: "greenhouse",
            mapperUsed: route.mapperUsed,
            employerAccountId: input.employerAccountId,
            connectionId: input.connectionId,
            correlationId,
            entity: { application, webhook: envelope },
            validation,
            durationMs: Date.now() - started,
            idempotencyKey,
            eventId: envelope.eventId,
            sequenceNumber: input.sequenceNumber,
          });
          return { ...result, universalEvent: route.universalEvent, providerEvent: route.providerEvent, mapperUsed: route.mapperUsed, correlationId, durationMs: Date.now() - started };
        }

        case ATS_EVENT_TYPES.JobCreated:
        case ATS_EVENT_TYPES.JobUpdated: {
          const job = mapGreenhouseJob(parseGreenhouseJob(webhook.payload));
          const validation = this.validator.validateJob(job);
          const result = this.pipeline.publish({
            universalEvent: route.universalEvent,
            providerEvent: route.providerEvent,
            provider: "greenhouse",
            mapperUsed: route.mapperUsed,
            employerAccountId: input.employerAccountId,
            connectionId: input.connectionId,
            correlationId,
            entity: { job, webhook: envelope },
            validation,
            durationMs: Date.now() - started,
            idempotencyKey,
            eventId: envelope.eventId,
            sequenceNumber: input.sequenceNumber,
          });
          return { ...result, universalEvent: route.universalEvent, providerEvent: route.providerEvent, mapperUsed: route.mapperUsed, correlationId, durationMs: Date.now() - started };
        }

        case ATS_EVENT_TYPES.OfferCreated:
        case ATS_EVENT_TYPES.OfferAccepted:
        case ATS_EVENT_TYPES.OfferRejected: {
          const offer = parseGreenhouseOffer(webhook.payload);
          const application = mapGreenhouseOfferApplication(offer, webhook.action);
          const validation = this.validator.validateApplication(application);
          const result = this.pipeline.publish({
            universalEvent: route.universalEvent,
            providerEvent: route.providerEvent,
            provider: "greenhouse",
            mapperUsed: route.mapperUsed,
            employerAccountId: input.employerAccountId,
            connectionId: input.connectionId,
            correlationId,
            entity: {
              application,
              offerExternalId: String(offer.id),
              webhook: envelope,
            },
            validation,
            durationMs: Date.now() - started,
            idempotencyKey,
            eventId: envelope.eventId,
            sequenceNumber: input.sequenceNumber,
          });
          return { ...result, universalEvent: route.universalEvent, providerEvent: route.providerEvent, mapperUsed: route.mapperUsed, correlationId, durationMs: Date.now() - started };
        }

        case ATS_EVENT_TYPES.CandidateHired:
        case ATS_EVENT_TYPES.CandidateRejected:
        case ATS_EVENT_TYPES.CandidateWithdrawn: {
          const application = mapGreenhouseApplicationFromAction(webhook.payload, webhook.action);
          const validation = this.validator.validateApplication(application);
          const result = this.pipeline.publish({
            universalEvent: route.universalEvent,
            providerEvent: route.providerEvent,
            provider: "greenhouse",
            mapperUsed: route.mapperUsed,
            employerAccountId: input.employerAccountId,
            connectionId: input.connectionId,
            correlationId,
            entity: { application, webhook: envelope },
            validation,
            durationMs: Date.now() - started,
            idempotencyKey,
            eventId: envelope.eventId,
            sequenceNumber: input.sequenceNumber,
          });
          return { ...result, universalEvent: route.universalEvent, providerEvent: route.providerEvent, mapperUsed: route.mapperUsed, correlationId, durationMs: Date.now() - started };
        }

        default:
          return {
            published: false,
            correlationId,
            durationMs: Date.now() - started,
            validation: {
              valid: false,
              errors: [
                {
                  code: "MALFORMED_PAYLOAD",
                  message: `No translator handler for ${route.universalEvent}`,
                },
              ],
              warnings: [],
            },
            reason: `No translator handler for ${route.universalEvent}`,
          };
      }
    } catch (error) {
      return {
        published: false,
        correlationId,
        durationMs: Date.now() - started,
        validation: {
          valid: false,
          errors: [
            {
              code: "MALFORMED_PAYLOAD",
              message: error instanceof Error ? error.message : "Malformed Greenhouse payload",
            },
          ],
          warnings: [],
        },
        reason: error instanceof Error ? error.message : "Malformed Greenhouse payload",
      };
    }
  }
}

export function createGreenhouseEventTranslator(
  pipeline: AtsEventPipeline,
  validator?: EventValidator
): GreenhouseEventTranslator {
  return new GreenhouseEventTranslator(pipeline, validator ?? pipeline.getValidator());
}
