import type { AtsProviderId } from "../../types/common";

/** Universal ATS company (hiring organization) model. */
export interface AtsCompany {
  externalId: string;
  provider: AtsProviderId;
  name: string;
  metadata?: Record<string, unknown>;
}
