import type { AtsProviderId, IntegrationResultStatus } from "./common";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface IntegrationLogEntry {
  timestamp: string;
  level: LogLevel;
  provider: AtsProviderId | "platform";
  correlationId: string;
  companyId?: string;
  event: string;
  durationMs?: number;
  result?: IntegrationResultStatus | "accepted" | "rejected";
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface LogContext {
  provider?: AtsProviderId | "platform";
  correlationId?: string;
  companyId?: string;
  event?: string;
}
