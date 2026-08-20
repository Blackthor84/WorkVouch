import type { AtsProviderId } from "../../types/common";
import type { ApplicationStatus } from "../../types/sync";

/** Universal ATS application — provider-agnostic interchange model. */
export interface AtsApplication {
  externalId: string;
  provider: AtsProviderId;
  candidateExternalId: string;
  jobExternalId: string;
  status: ApplicationStatus;
  stageName?: string;
  appliedAt?: string;
  updatedAt?: string;
  offerExternalId?: string;
  metadata?: Record<string, unknown>;
}
