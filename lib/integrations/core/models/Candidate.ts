import type { AtsProviderId } from "../../types/common";
import type { ApplicationStatus } from "../../types/sync";
import type { TrustStatus } from "./TrustStatus";
import type { VerificationStatus } from "./VerificationStatus";

/** Universal ATS candidate — provider-agnostic interchange model. */
export interface AtsCandidate {
  externalId: string;
  provider: AtsProviderId;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  applicationStatus?: ApplicationStatus;
  jobExternalId?: string;
  applicationExternalId?: string;
  trustStatus?: TrustStatus;
  verificationStatus?: VerificationStatus;
  appliedAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}
