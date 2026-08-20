import type { AtsProviderId } from "./common";
import type { ProviderConfiguration } from "./provider";

export type IntegrationFeatureFlag =
  | "ATS_ENABLED"
  | "GREENHOUSE_ENABLED"
  | "LEVER_ENABLED"
  | "ASHBY_ENABLED"
  | "WORKDAY_ENABLED"
  | "BAMBOOHR_ENABLED"
  | "RIPPLING_ENABLED"
  | "HIBOB_ENABLED"
  | "ICIMS_ENABLED"
  | "MOCK_ATS_ENABLED"
  | "SMARTRECRUITERS_ENABLED";

export interface IntegrationPlatformConfig {
  encryptionKey?: string;
  defaultEventMaxAttempts: number;
  defaultRetryBackoffMs: number[];
  webhookResponseTimeoutMs: number;
  panelJwtSecret?: string;
  cronSecret?: string;
  providers: Partial<Record<AtsProviderId, ProviderConfiguration>>;
}

export interface FeatureFlagSnapshot {
  flags: Record<IntegrationFeatureFlag, boolean>;
  evaluatedAt: string;
}
