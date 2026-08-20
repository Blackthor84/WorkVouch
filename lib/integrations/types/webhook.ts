import type { AtsProviderId } from "./common";

export interface ReceiveWebhookParams {
  connectionId: string;
  employerAccountId: string;
  rawBody: string;
  headers: Record<string, string>;
  webhookSecret: string;
}

export interface ParsedWebhookEvent {
  eventId: string;
  eventType: string;
  provider: AtsProviderId;
  externalCandidateId?: string;
  externalJobId?: string;
  externalApplicationId?: string;
  payload: Record<string, unknown>;
  receivedAt: string;
}

export interface WebhookReceiveResult {
  accepted: boolean;
  duplicate: boolean;
  event?: ParsedWebhookEvent;
  error?: string;
}
