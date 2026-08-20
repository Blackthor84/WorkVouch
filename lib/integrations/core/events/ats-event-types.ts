import type { AtsCandidate } from "../models/Candidate";
import type { AtsJob } from "../models/Job";
import type { AtsApplication } from "../models/Application";
import type { AtsCompany } from "../models/Company";
import type { AtsEmployer } from "../models/Employer";
import type { AtsWebhookEvent } from "../models/WebhookEvent";

/** Standard ATS event types every provider must emit. */
export const ATS_EVENT_TYPES = {
  CandidateCreated: "ats.candidate.created",
  CandidateUpdated: "ats.candidate.updated",
  CandidateMoved: "ats.candidate.moved",
  ApplicationCreated: "ats.application.created",
  JobCreated: "ats.job.created",
  JobUpdated: "ats.job.updated",
  OfferCreated: "ats.offer.created",
  OfferAccepted: "ats.offer.accepted",
  OfferRejected: "ats.offer.rejected",
  CandidateHired: "ats.candidate.hired",
  CandidateRejected: "ats.candidate.rejected",
  CandidateWithdrawn: "ats.candidate.withdrawn",
} as const;

export type AtsEventType = (typeof ATS_EVENT_TYPES)[keyof typeof ATS_EVENT_TYPES];

export const ALL_ATS_EVENT_TYPES: AtsEventType[] = Object.values(ATS_EVENT_TYPES);

export interface AtsEventEnvelope<TPayload = Record<string, unknown>> {
  universalEvent: AtsEventType;
  providerEvent: string;
  mapperUsed: string;
  employerAccountId: string;
  connectionId: string;
  correlationId: string;
  translatedAt: string;
  durationMs: number;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  entity: TPayload;
}

export type CandidateEventPayload = AtsEventEnvelope<{ candidate: AtsCandidate }>;
export type JobEventPayload = AtsEventEnvelope<{ job: AtsJob }>;
export type ApplicationEventPayload = AtsEventEnvelope<{ application: AtsApplication }>;
export type OfferEventPayload = AtsEventEnvelope<{
  application: AtsApplication;
  offerExternalId?: string;
}>;
export type WebhookEventPayload = AtsEventEnvelope<{ webhook: AtsWebhookEvent }>;
export type CompanyEventPayload = AtsEventEnvelope<{ company: AtsCompany; employer?: AtsEmployer }>;

export function isAtsEventType(value: string): value is AtsEventType {
  return ALL_ATS_EVENT_TYPES.includes(value as AtsEventType);
}
