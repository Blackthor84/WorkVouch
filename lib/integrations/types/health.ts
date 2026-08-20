import type { AtsProviderId } from "./common";

export type ProviderHealthState =
  | "connected"
  | "disconnected"
  | "healthy"
  | "degraded"
  | "offline"
  | "configuration_invalid"
  | "oauth_expired"
  | "webhook_failure"
  | "rate_limited";

export interface ProviderHealthReport {
  providerId: AtsProviderId;
  connectionId?: string;
  employerAccountId?: string;
  state: ProviderHealthState;
  message?: string;
  latencyMs?: number;
  lastCheckedAt: string;
  issues: string[];
}

export interface PlatformHealthSummary {
  platform: "healthy" | "degraded" | "unhealthy";
  providers: ProviderHealthReport[];
  checkedAt: string;
}
