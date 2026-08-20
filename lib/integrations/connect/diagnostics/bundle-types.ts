import type { AtsProviderId } from "../../types/common";

export const DIAGNOSTIC_BUNDLE_VERSION = "1.0.0";

export interface RedactionRecord {
  path: string;
  reason: string;
  originalType: string;
}

export interface DiagnosticBundleManifest {
  bundleVersion: string;
  generatedAt: string;
  connectionId: string;
  employerAccountId: string;
  provider: AtsProviderId;
  connectVersion: string;
  providerVersion: string;
  fileCount: number;
  redactionCount: number;
  checksums: Record<string, string>;
}

export interface DiagnosticBundleLogEntry {
  level: "info" | "warn" | "error";
  message: string;
  correlationId?: string;
  event?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ReplayReference {
  eventId: string;
  correlationId: string;
  aggregateType?: string;
  aggregateId?: string;
  universalEvent?: string;
  checkpointId?: string;
  snapshotId?: string;
  replayInstruction: string;
}

export interface DiagnosticBundle {
  manifest: DiagnosticBundleManifest;
  connection: Record<string, unknown>;
  health: Record<string, unknown>;
  syncCursor: Record<string, unknown> | null;
  syncHistory: Record<string, unknown>;
  recentEvents: Record<string, unknown>[];
  auditTrail: Record<string, unknown>[];
  replayReferences: ReplayReference[];
  projectionState: Record<string, unknown>;
  platform: Record<string, unknown>;
  providerManifest: Record<string, unknown>;
  connectionConfiguration: Record<string, unknown>;
  featureFlags: Record<string, unknown>;
  environmentValidation: Record<string, unknown>;
  performanceMetrics: Record<string, unknown>;
  errorSummary: { count: number; items: DiagnosticBundleLogEntry[] };
  warningSummary: { count: number; items: DiagnosticBundleLogEntry[] };
  logs: DiagnosticBundleLogEntry[];
  redactions: RedactionRecord[];
  readme: string;
}

export interface BundleBuildOptions {
  connectionId: string;
  employerAccountId: string;
  maxEvents?: number;
  maxLogs?: number;
}

export interface BundleExportResult {
  format: "json" | "zip" | "markdown";
  filename: string;
  contentType: string;
  data: Buffer | string;
  sizeBytes: number;
  generatedAt: string;
}

export interface BundleValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  redactionCount: number;
  secretLeaks: string[];
}

export interface BundlePreview {
  manifest: DiagnosticBundleManifest;
  healthStatus: string;
  topErrors: string[];
  suggestedNextSteps: string[];
  estimatedSizeBytes: number;
}
