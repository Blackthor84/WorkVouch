import type { AtsProviderId } from "../../types/common";

/** Universal webhook envelope after provider normalization. */
export interface AtsWebhookEvent {
  eventId: string;
  providerEventType: string;
  provider: AtsProviderId;
  receivedAt: string;
  externalCandidateId?: string;
  externalJobId?: string;
  externalApplicationId?: string;
  externalOfferId?: string;
  rawAction: string;
  payload: Record<string, unknown>;
}
