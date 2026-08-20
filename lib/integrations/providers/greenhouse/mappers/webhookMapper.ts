import type { AtsWebhookEvent } from "../../../core/models/WebhookEvent";
import type { AtsEventType } from "../../../core/events/ats-event-types";
import { ATS_EVENT_TYPES } from "../../../core/events/ats-event-types";
import type { GreenhouseWebhookAction, GreenhouseWebhookPayload } from "../models";
import { GREENHOUSE_PROVIDER, assertRecord, parseGreenhousePayload, readString } from "./sharedMapper";

export const WEBHOOK_MAPPER_NAME = "greenhouse.webhookMapper";

export interface WebhookTranslationRoute {
  universalEvent: AtsEventType;
  providerEvent: string;
  mapperUsed: string;
}

const ACTION_ROUTES: Record<GreenhouseWebhookAction, WebhookTranslationRoute> = {
  candidate_created: {
    universalEvent: ATS_EVENT_TYPES.CandidateCreated,
    providerEvent: "candidate_created",
    mapperUsed: "greenhouse.candidateMapper",
  },
  candidate_updated: {
    universalEvent: ATS_EVENT_TYPES.CandidateUpdated,
    providerEvent: "candidate_updated",
    mapperUsed: "greenhouse.candidateMapper",
  },
  application_created: {
    universalEvent: ATS_EVENT_TYPES.ApplicationCreated,
    providerEvent: "application_created",
    mapperUsed: "greenhouse.applicationMapper",
  },
  application_updated: {
    universalEvent: ATS_EVENT_TYPES.CandidateMoved,
    providerEvent: "application_updated",
    mapperUsed: "greenhouse.applicationMapper",
  },
  application_stage_changed: {
    universalEvent: ATS_EVENT_TYPES.CandidateMoved,
    providerEvent: "application_stage_changed",
    mapperUsed: "greenhouse.applicationMapper",
  },
  job_created: {
    universalEvent: ATS_EVENT_TYPES.JobCreated,
    providerEvent: "job_created",
    mapperUsed: "greenhouse.jobMapper",
  },
  job_updated: {
    universalEvent: ATS_EVENT_TYPES.JobUpdated,
    providerEvent: "job_updated",
    mapperUsed: "greenhouse.jobMapper",
  },
  offer_created: {
    universalEvent: ATS_EVENT_TYPES.OfferCreated,
    providerEvent: "offer_created",
    mapperUsed: "greenhouse.applicationMapper",
  },
  offer_accepted: {
    universalEvent: ATS_EVENT_TYPES.OfferAccepted,
    providerEvent: "offer_accepted",
    mapperUsed: "greenhouse.applicationMapper",
  },
  offer_rejected: {
    universalEvent: ATS_EVENT_TYPES.OfferRejected,
    providerEvent: "offer_rejected",
    mapperUsed: "greenhouse.applicationMapper",
  },
  hire_candidate: {
    universalEvent: ATS_EVENT_TYPES.CandidateHired,
    providerEvent: "hire_candidate",
    mapperUsed: "greenhouse.applicationMapper",
  },
  reject_candidate: {
    universalEvent: ATS_EVENT_TYPES.CandidateRejected,
    providerEvent: "reject_candidate",
    mapperUsed: "greenhouse.applicationMapper",
  },
  candidate_withdrawn: {
    universalEvent: ATS_EVENT_TYPES.CandidateWithdrawn,
    providerEvent: "candidate_withdrawn",
    mapperUsed: "greenhouse.applicationMapper",
  },
};

export function parseGreenhouseWebhook(raw: unknown): GreenhouseWebhookPayload {
  const parsed = parseGreenhousePayload(raw);
  const action = readString(parsed.action, "action");
  const payload = assertRecord(parsed.payload, "payload");
  return { action, payload };
}

export function routeGreenhouseWebhook(action: string): WebhookTranslationRoute | null {
  return ACTION_ROUTES[action as GreenhouseWebhookAction] ?? null;
}

export function mapGreenhouseWebhookEnvelope(
  webhook: GreenhouseWebhookPayload,
  receivedAt: string
): AtsWebhookEvent {
  const payload = webhook.payload;
  return {
    eventId: `${webhook.action}:${String(payload.id ?? "unknown")}:${String(payload.updated_at ?? receivedAt)}`,
    providerEventType: webhook.action,
    provider: GREENHOUSE_PROVIDER,
    receivedAt,
    externalCandidateId: payload.candidate_id ? String(payload.candidate_id) : undefined,
    externalJobId: Array.isArray(payload.jobs)
      ? String((payload.jobs[0] as { id?: number })?.id ?? "")
      : undefined,
    externalApplicationId: payload.application_id
      ? String(payload.application_id)
      : payload.id
        ? String(payload.id)
        : undefined,
    externalOfferId: webhook.action.startsWith("offer_") ? String(payload.id ?? "") : undefined,
    rawAction: webhook.action,
    payload,
  };
}

export function buildIdempotencyKey(webhook: GreenhouseWebhookPayload): string {
  const payload = webhook.payload;
  const entityId = payload.id ?? payload.application_id ?? payload.candidate_id ?? "unknown";
  return `${webhook.action}:${String(entityId)}:${String(payload.updated_at ?? "na")}`;
}
