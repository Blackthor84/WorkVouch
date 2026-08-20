import type { AtsEventPipeline } from "../../core/pipeline/ats-event-pipeline";
import type { DeadLetterQueue } from "../../queue/DeadLetterQueue";
import type { LoggingService } from "../../logging/LoggingService";
import type { ConnectPlatform } from "../connect-platform";
import type { CandidateMapRepository } from "../persistence/repositories/candidate-map-repository";
import type { JobMapRepository } from "../persistence/repositories/job-map-repository";
import type { SyncCursorManager } from "../sync/sync-cursor-manager";
import { createGreenhouseEventTranslator } from "../../providers/greenhouse/services/event-translator";
import {
  buildIdempotencyKey,
  parseGreenhouseWebhook,
  routeGreenhouseWebhook,
} from "../../providers/greenhouse/mappers/webhookMapper";
import { mapGreenhouseCandidate } from "../../providers/greenhouse/mappers/candidateMapper";
import { mapGreenhouseJob } from "../../providers/greenhouse/mappers/jobMapper";
import { mapGreenhouseApplication } from "../../providers/greenhouse/mappers/applicationMapper";
import {
  parseGreenhouseApplication,
  parseGreenhouseCandidate,
  parseGreenhouseJob,
} from "../../providers/greenhouse/mappers";
import { ATS_EVENT_TYPES } from "../../core/events/ats-event-types";
import { createCorrelationId, nowIso } from "../../utils/correlation";
import type { WebhookMetrics } from "./webhook-metrics";

export interface ProcessGreenhouseWebhookInput {
  rawPayload: unknown;
  connectionId: string;
  employerAccountId: string;
  correlationId?: string;
  webhookLogId?: string;
}

export interface ProcessGreenhouseWebhookResult {
  success: boolean;
  correlationId: string;
  universalEvent?: string;
  providerEvent?: string;
  eventStored: boolean;
  projected: boolean;
  duplicatePrevented: boolean;
  durationMs: number;
  error?: string;
}

export interface GreenhouseWebhookProcessorDeps {
  pipeline: AtsEventPipeline;
  connect: ConnectPlatform;
  cursorManager?: SyncCursorManager;
  jobMap?: JobMapRepository;
  candidateMap?: CandidateMapRepository;
  deadLetterQueue: DeadLetterQueue;
  logger: LoggingService;
  metrics?: WebhookMetrics;
}

/** Real-time webhook pipeline: validate → translate → store → project → audit. */
export class GreenhouseWebhookProcessor {
  private readonly translator;

  constructor(private readonly deps: GreenhouseWebhookProcessorDeps) {
    this.translator = createGreenhouseEventTranslator(deps.pipeline, deps.pipeline.getValidator());
  }

  async process(input: ProcessGreenhouseWebhookInput): Promise<ProcessGreenhouseWebhookResult> {
    const started = Date.now();
    const correlationId = input.correlationId ?? createCorrelationId("gh-wh");

    try {
      const webhook = parseGreenhouseWebhook(input.rawPayload);
      const route = routeGreenhouseWebhook(webhook.action);
      if (!route) {
        this.deps.metrics?.recordValidationFailure();
        this.enqueueDeadLetter(input, `Unsupported action: ${webhook.action}`, correlationId);
        return {
          success: false,
          correlationId,
          eventStored: false,
          projected: false,
          duplicatePrevented: false,
          durationMs: Date.now() - started,
          error: `Unsupported action: ${webhook.action}`,
        };
      }

      const translation = this.translator.translateAndPublish({
        rawPayload: input.rawPayload,
        employerAccountId: input.employerAccountId,
        connectionId: input.connectionId,
        correlationId,
      });

      if (!translation.validation.valid) {
        this.deps.metrics?.recordValidationFailure();
        this.enqueueDeadLetter(input, translation.reason ?? "Validation failed", correlationId);
        return {
          success: false,
          correlationId,
          providerEvent: translation.providerEvent,
          eventStored: false,
          projected: false,
          duplicatePrevented: false,
          durationMs: Date.now() - started,
          error: translation.reason,
        };
      }

      this.deps.connect.recordReceived({
        correlationId,
        provider: "greenhouse",
        rawPayload: input.rawPayload,
        employerAccountId: input.employerAccountId,
        connectionId: input.connectionId,
        providerEvent: translation.providerEvent,
        universalEvent: translation.universalEvent,
        metadata: { webhookLogId: input.webhookLogId, source: "webhook" },
      });

      const entity = this.extractEntity(input.rawPayload, translation.universalEvent);
      this.deps.connect.captureTranslation({
        correlationId,
        provider: "greenhouse",
        rawPayload: input.rawPayload,
        employerAccountId: input.employerAccountId,
        connectionId: input.connectionId,
        providerEvent: translation.providerEvent,
        universalEvent: translation.universalEvent,
        universalModel: entity ? { entity } : undefined,
        validation: translation.validation,
        translation: {
          mapperUsed: translation.mapperUsed ?? "greenhouse.webhookMapper",
          durationMs: translation.durationMs,
          published: translation.published,
        },
        published: translation.published,
        busEventId: translation.eventId,
        metadata: { webhookLogId: input.webhookLogId, idempotencyKey: buildIdempotencyKey(webhook) },
      });

      await this.deps.connect.flushPersistence();
      await this.updateMaps(input.connectionId, translation.universalEvent, input.rawPayload);
      await this.updateCursor(input.connectionId, webhook.action, translation.eventId);

      const durationMs = Date.now() - started;
      this.deps.metrics?.recordDelivery(translation.published, durationMs);

      return {
        success: translation.published,
        correlationId,
        universalEvent: translation.universalEvent,
        providerEvent: translation.providerEvent,
        eventStored: translation.published,
        projected: translation.published,
        duplicatePrevented: true,
        durationMs,
        error: translation.published ? undefined : translation.reason,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Webhook processing failed";
      this.enqueueDeadLetter(input, message, correlationId);
      this.deps.metrics?.recordDelivery(false, Date.now() - started);
      return {
        success: false,
        correlationId,
        eventStored: false,
        projected: false,
        duplicatePrevented: false,
        durationMs: Date.now() - started,
        error: message,
      };
    }
  }

  private extractEntity(rawPayload: unknown, universalEvent?: string): Record<string, unknown> | null {
    try {
      const webhook = parseGreenhouseWebhook(rawPayload);
      switch (universalEvent) {
        case ATS_EVENT_TYPES.CandidateCreated:
        case ATS_EVENT_TYPES.CandidateUpdated:
          return { candidate: mapGreenhouseCandidate(parseGreenhouseCandidate(webhook.payload)) };
        case ATS_EVENT_TYPES.JobCreated:
        case ATS_EVENT_TYPES.JobUpdated:
          return { job: mapGreenhouseJob(parseGreenhouseJob(webhook.payload)) };
        case ATS_EVENT_TYPES.ApplicationCreated:
        case ATS_EVENT_TYPES.CandidateMoved:
        case ATS_EVENT_TYPES.CandidateHired:
        case ATS_EVENT_TYPES.CandidateRejected:
        case ATS_EVENT_TYPES.CandidateWithdrawn:
        case ATS_EVENT_TYPES.OfferCreated:
        case ATS_EVENT_TYPES.OfferAccepted:
        case ATS_EVENT_TYPES.OfferRejected:
          return { application: mapGreenhouseApplication(parseGreenhouseApplication(webhook.payload)) };
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  private async updateMaps(connectionId: string, universalEvent?: string, rawPayload?: unknown): Promise<void> {
    if (!rawPayload || !universalEvent) return;
    const webhook = parseGreenhouseWebhook(rawPayload);

    if (
      this.deps.candidateMap &&
      (universalEvent === ATS_EVENT_TYPES.CandidateCreated ||
        universalEvent === ATS_EVENT_TYPES.CandidateUpdated)
    ) {
      const candidate = mapGreenhouseCandidate(parseGreenhouseCandidate(webhook.payload));
      await this.deps.candidateMap.upsert({
        connectionId,
        externalCandidateId: candidate.externalId,
        candidateEmail: candidate.email,
        candidateName: candidate.fullName,
        applicationStatus: candidate.applicationStatus,
        metadata: candidate.metadata ?? {},
      });
    }

    if (
      this.deps.jobMap &&
      (universalEvent === ATS_EVENT_TYPES.JobCreated || universalEvent === ATS_EVENT_TYPES.JobUpdated)
    ) {
      const job = mapGreenhouseJob(parseGreenhouseJob(webhook.payload));
      await this.deps.jobMap.upsert({
        connectionId,
        externalJobId: job.externalId,
        jobTitle: job.title,
        status: job.status,
        metadata: job.metadata ?? {},
      });
    }
  }

  private async updateCursor(connectionId: string, action: string, lastEventId?: string): Promise<void> {
    if (!this.deps.cursorManager) return;
    const now = nowIso();
    await this.deps.cursorManager.updateCursor(connectionId, {
      lastWebhookProcessed: now,
      lastEventReceived: now,
      lastProjectionCompleted: now,
      lastCandidateImported: action.includes("candidate") ? now : undefined,
      lastJobImported: action.includes("job") ? now : undefined,
      lastApplicationImported:
        action.includes("application") ||
        action.includes("offer") ||
        action.includes("hire") ||
        action.includes("reject")
          ? now
          : undefined,
      providerCursor: { lastWebhookAction: action, lastEventId },
    });
  }

  private enqueueDeadLetter(
    input: ProcessGreenhouseWebhookInput,
    error: string,
    correlationId: string
  ): void {
    this.deps.deadLetterQueue.enqueue(
      {
        id: input.webhookLogId ?? correlationId,
        type: "webhook.greenhouse.failed",
        provider: "greenhouse",
        employerAccountId: input.employerAccountId,
        connectionId: input.connectionId,
        correlationId,
        priority: 1,
        payload: { rawPayload: input.rawPayload, error },
        status: "dead_letter",
        attemptCount: 0,
        maxAttempts: 5,
        scheduledAt: nowIso(),
        createdAt: nowIso(),
        lastError: error,
      },
      { sourceType: "webhook", failureReason: error }
    );
    this.deps.metrics?.recordDeadLetter();
    this.deps.logger.warn("Webhook sent to DLQ", {
      provider: "greenhouse",
      correlationId,
      companyId: input.employerAccountId,
      metadata: { connectionId: input.connectionId, error },
    });
  }
}
