import type { AtsProviderId } from "../types/common";
import type { IntegrationEvent } from "../types/events";
import type { IntegrationLogEntry } from "../types/logging";
import type { EventValidationResult } from "../core/validation/validation-types";

/** WorkVouch Connect — internal developer platform for provider observability. */
export const WORKVOUCH_CONNECT_NAME = "WorkVouch Connect";

export type ConnectLifecycleStage =
  | "received"
  | "validated"
  | "mapped"
  | "published"
  | "consumed"
  | "succeeded"
  | "failed"
  | "retried"
  | "completed";

export type ConnectAuditAction =
  | "received"
  | "validated"
  | "mapped"
  | "published"
  | "consumed"
  | "succeeded"
  | "failed"
  | "retried";

export interface ConnectAuditEntry {
  id: string;
  action: ConnectAuditAction;
  timestamp: string;
  durationMs?: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface ConnectTimelineEntry {
  stage: ConnectLifecycleStage;
  timestamp: string;
  durationMs?: number;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface ConnectTranslationInfo {
  mapperUsed: string;
  providerEvent: string;
  universalEvent: string;
  durationMs: number;
}

export interface ConnectEventRecord {
  id: string;
  correlationId: string;
  provider: AtsProviderId;
  providerEvent?: string;
  universalEvent?: string;
  employerAccountId?: string;
  connectionId?: string;
  rawPayload?: unknown;
  providerPayload?: unknown;
  universalModel?: unknown;
  validation?: EventValidationResult;
  translation?: ConnectTranslationInfo;
  busEvent?: IntegrationEvent;
  replayCount: number;
  simulationOnly: boolean;
  timeline: ConnectTimelineEntry[];
  auditTrail: ConnectAuditEntry[];
  logs: IntegrationLogEntry[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectEventFilter {
  provider?: AtsProviderId;
  correlationId?: string;
  universalEvent?: string;
  employerAccountId?: string;
  connectionId?: string;
  limit?: number;
}

export interface ReplayOptions {
  dryRun?: boolean;
  simulate?: boolean;
  replayTranslation?: boolean;
  replayValidation?: boolean;
  replayConsumer?: boolean;
  replayPipeline?: boolean;
}

export interface ReplayResult {
  eventId: string;
  correlationId: string;
  mode: "dry_run" | "simulation" | "live";
  stagesReplayed: ConnectLifecycleStage[];
  success: boolean;
  durationMs: number;
  validation?: EventValidationResult;
  universalModel?: unknown;
  consumerResult?: { schemaValid: boolean; errors: string[] };
  message?: string;
  duplicatePrevented: boolean;
}

export interface PayloadComparison {
  equal: boolean;
  providerDiff?: string[];
  universalDiff?: string[];
}

export interface CorrelationExploration {
  correlationId: string;
  provider?: AtsProviderId;
  events: ConnectEventRecord[];
  timeline: ConnectTimelineEntry[];
  auditTrail: ConnectAuditEntry[];
  logs: IntegrationLogEntry[];
  replayHistory: ReplayResult[];
}

export interface ConnectDiagnosticsReport {
  platform: string;
  evaluatedAt: string;
  configuration: { valid: boolean; errors: string[]; warnings: string[] };
  featureFlags: Record<string, boolean>;
  providers: Array<{
    providerId: AtsProviderId;
    registered: boolean;
    enabled: boolean;
    capabilities?: Record<string, unknown>;
  }>;
  environment: { valid: boolean; issues: string[] };
  oauthHealth?: { healthy: boolean; message?: string };
  tokenStatus?: { status: string; message?: string };
}

export interface EventInspection {
  event: ConnectEventRecord;
  payload: unknown;
  providerPayload: unknown;
  universalModel: unknown;
  validation: EventValidationResult | undefined;
  translation: ConnectTranslationInfo | undefined;
  timeline: ConnectTimelineEntry[];
  metadata: Record<string, unknown>;
  logs: IntegrationLogEntry[];
}
