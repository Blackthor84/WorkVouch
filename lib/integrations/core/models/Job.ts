import type { AtsProviderId } from "../../types/common";

export interface AtsJobLocation {
  country: string;
  state?: string;
}

/** Universal ATS job — provider-agnostic interchange model. */
export interface AtsJob {
  externalId: string;
  provider: AtsProviderId;
  title: string;
  status: "open" | "closed" | "draft" | "archived";
  department?: string;
  location?: AtsJobLocation;
  openedAt?: string;
  closedAt?: string;
  metadata?: Record<string, unknown>;
}
