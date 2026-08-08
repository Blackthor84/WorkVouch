import { createHash } from "crypto";
import type { DiagnosticBundleRuntime } from "./bundle-runtime";
import { CONNECT_PLATFORM_VERSION } from "../version";
import { GREENHOUSE_MANIFEST } from "../../providers/greenhouse/config/manifest";
import { loadSyncHistory, loadEventHistory, loadFailedWebhooks } from "../../../employer/integrations/service";
import type {
  BundleBuildOptions,
  DiagnosticBundle,
  DiagnosticBundleLogEntry,
  DiagnosticBundleManifest,
  ReplayReference,
} from "./bundle-types";
import { DIAGNOSTIC_BUNDLE_VERSION } from "./bundle-types";
import { BundleRedactor } from "./bundle-redactor";
import { nowIso } from "../../utils/correlation";

const DEFAULT_MAX_EVENTS = 100;
const DEFAULT_MAX_LOGS = 200;

/** Assembles a complete diagnostic bundle from Connect runtime state. */
export class BundleBuilder {
  private readonly redactor = new BundleRedactor();

  constructor(private readonly runtime: DiagnosticBundleRuntime) {}

  async build(options: BundleBuildOptions): Promise<DiagnosticBundle> {
    const { connectionId, employerAccountId } = options;
    const maxEvents = options.maxEvents ?? DEFAULT_MAX_EVENTS;
    const maxLogs = options.maxLogs ?? DEFAULT_MAX_LOGS;

    const connection = await this.runtime.connections.getConnection(connectionId);
    if (!connection || connection.employerAccountId !== employerAccountId) {
      throw new Error("Connection not found or access denied");
    }

    const [healthReport, cursor, syncHistory, eventHistory, failures] = await Promise.all([
      this.runtime.health.evaluate(connectionId),
      this.runtime.connections.getCursor(connectionId),
      loadSyncHistory(connectionId, 50),
      loadEventHistory(connectionId, employerAccountId, maxEvents),
      loadFailedWebhooks(connectionId, 30),
    ]);

    const platformDiagnostics = this.runtime.connect.runDiagnostics();
    const webhookMetrics = this.runtime.webhookMetrics.getSnapshot();
    const lifecycleMetrics = this.runtime.lifecycleObservability.getSnapshot();
    const hiringSnapshot = await this.runtime.hiringMetrics
      .computeMetrics({ employerAccountId, connectionId, period: "7d" })
      .catch(() => null);

    const recentEvents = (eventHistory.events ?? []).slice(0, maxEvents);
    const replayReferences = this.buildReplayReferences(recentEvents, eventHistory.webhooks ?? []);
    const auditTrail = this.buildAuditTrail(recentEvents);
    const logs = this.buildLogs(recentEvents, failures, maxLogs);
    const errors = logs.filter((l) => l.level === "error");
    const warnings = logs.filter((l) => l.level === "warn");

    const connectionSafe = {
      connectionId: connection.connectionId,
      employerAccountId: connection.employerAccountId,
      provider: connection.provider,
      status: connection.status,
      tokenStatus: connection.tokenStatus,
      oauthScopes: connection.oauthScopes,
      providerAccountId: connection.providerAccountId,
      providerAccountName: connection.providerAccountName,
      tokenExpiresAt: connection.tokenExpiresAt,
      lastHealthCheckAt: connection.lastHealthCheckAt,
      lastHealthStatus: connection.lastHealthStatus,
      lastSyncAt: connection.lastSyncAt,
      metadata: connection.metadata,
      createdAt: connection.createdAt,
      updatedAt: connection.updatedAt,
    };

    const raw: Omit<DiagnosticBundle, "manifest" | "redactions" | "readme"> = {
      connection: connectionSafe as unknown as Record<string, unknown>,
      health: healthReport as unknown as Record<string, unknown>,
      syncCursor: (cursor as unknown as Record<string, unknown>) ?? null,
      syncHistory: syncHistory as unknown as Record<string, unknown>,
      recentEvents,
      auditTrail,
      replayReferences,
      projectionState: {
        note: "Projection samples from recent candidate aggregates",
        webhookMetrics,
        lifecycleMetrics,
      },
      platform: {
        connectVersion: CONNECT_PLATFORM_VERSION,
        diagnostics: platformDiagnostics,
      },
      providerManifest: GREENHOUSE_MANIFEST as unknown as Record<string, unknown>,
      connectionConfiguration: {
        automation: (connection.metadata?.sync_preferences as Record<string, unknown>)?.automation ?? {},
        oauthScopes: connection.oauthScopes,
      },
      featureFlags: platformDiagnostics.featureFlags ?? {},
      environmentValidation: platformDiagnostics.environment ?? {},
      performanceMetrics: {
        webhook: webhookMetrics,
        lifecycle: lifecycleMetrics,
        hiring: hiringSnapshot,
        healthLatencyMs: healthReport.components?.find((c) => c.name === "harvest")?.latencyMs,
      },
      errorSummary: { count: errors.length, items: errors.slice(0, 20) },
      warningSummary: { count: warnings.length, items: warnings.slice(0, 20) },
      logs: logs.slice(0, maxLogs),
    };

    const redacted = this.redactor.redact(raw) as Omit<DiagnosticBundle, "manifest" | "redactions" | "readme">;
    const redactions = this.redactor.getRedactions();

    const manifest: DiagnosticBundleManifest = {
      bundleVersion: DIAGNOSTIC_BUNDLE_VERSION,
      generatedAt: nowIso(),
      connectionId,
      employerAccountId,
      provider: connection.provider,
      connectVersion: CONNECT_PLATFORM_VERSION,
      providerVersion: GREENHOUSE_MANIFEST.version,
      fileCount: 12,
      redactionCount: redactions.length,
      checksums: {},
    };

    const readme = this.generateReadme({
      connection: connectionSafe,
      health: healthReport,
      errors,
      failures,
      manifest,
    });

    const bundle: DiagnosticBundle = {
      manifest,
      ...redacted,
      redactions,
      readme,
    };

    bundle.manifest.checksums = {
      bundle: checksum(JSON.stringify({ ...bundle, manifest: { ...manifest, checksums: {} } })),
    };

    return bundle;
  }

  private buildReplayReferences(
    events: Record<string, unknown>[],
    webhooks: Record<string, unknown>[]
  ): ReplayReference[] {
    const refs: ReplayReference[] = [];

    for (const event of events.slice(0, 30)) {
      refs.push({
        eventId: String(event.id ?? ""),
        correlationId: String(event.correlation_id ?? ""),
        aggregateType: String(event.aggregate_type ?? ""),
        aggregateId: String(event.aggregate_id ?? ""),
        universalEvent: String(event.event_type ?? ""),
        replayInstruction: `POST /api/employer/integrations/connections/{connectionId}/events/${event.id}/replay with mode simulation`,
      });
    }

    for (const wh of webhooks.slice(0, 10)) {
      refs.push({
        eventId: String(wh.id ?? ""),
        correlationId: String(wh.correlation_id ?? ""),
        universalEvent: String(wh.universal_event ?? ""),
        replayInstruction: `POST /api/employer/integrations/connections/{connectionId}/replay with webhookLogId ${wh.id}`,
      });
    }

    return refs;
  }

  private buildAuditTrail(events: Record<string, unknown>[]): Record<string, unknown>[] {
    return events.map((e) => ({
      eventId: e.id,
      correlationId: e.correlation_id,
      eventType: e.event_type,
      occurredAt: e.occurred_at,
      aggregateType: e.aggregate_type,
      aggregateId: e.aggregate_id,
    }));
  }

  private buildLogs(
    events: Record<string, unknown>[],
    failures: Record<string, unknown>[],
    maxLogs: number
  ): DiagnosticBundleLogEntry[] {
    const logs: DiagnosticBundleLogEntry[] = [];

    for (const f of failures) {
      logs.push({
        level: "error",
        message: String(f.error_message ?? "Webhook processing failed"),
        correlationId: String(f.correlation_id ?? ""),
        event: String(f.provider_event ?? f.universal_event ?? ""),
        timestamp: String(f.created_at ?? nowIso()),
      });
    }

    for (const e of events) {
      if (String(e.event_type ?? "").includes("cancelled") || String(e.event_type ?? "").includes("failed")) {
        logs.push({
          level: "warn",
          message: `Event: ${e.event_type}`,
          correlationId: String(e.correlation_id ?? ""),
          event: String(e.event_type ?? ""),
          timestamp: String(e.occurred_at ?? ""),
        });
      }
    }

    return logs.slice(0, maxLogs);
  }

  private generateReadme(input: {
    connection: Record<string, unknown>;
    health: { overallStatus?: string; overallScore?: number; components?: Array<{ name: string; status: string; message: string }> };
    errors: DiagnosticBundleLogEntry[];
    failures: Record<string, unknown>[];
    manifest: DiagnosticBundleManifest;
  }): string {
    const topErrors = input.errors.slice(0, 5).map((e) => `- ${e.message} (${e.correlationId || "no correlation"})`);
    const steps = this.suggestNextSteps(input.health, input.failures.length);

    return `# WorkVouch Connect Diagnostic Bundle

Generated: ${input.manifest.generatedAt}
Bundle version: ${input.manifest.bundleVersion}

## Provider
- **Provider:** ${input.manifest.provider}
- **Connection ID:** ${input.manifest.connectionId}
- **Status:** ${input.connection.status}
- **Connect version:** ${input.manifest.connectVersion}
- **Provider version:** ${input.manifest.providerVersion}

## Health
- **Overall:** ${input.health.overallStatus ?? "unknown"} (${input.health.overallScore ?? "—"}/100)

## Top Errors
${topErrors.length > 0 ? topErrors.join("\n") : "- No recent errors recorded"}

## Recent Failures
- Failed webhooks: ${input.failures.length}

## Suggested Next Steps
${steps.map((s) => `- ${s}`).join("\n")}

## Bundle Contents
- \`bundle.json\` — Full diagnostic data (redacted)
- \`manifest.json\` — Bundle metadata and checksums
- \`README.md\` — This summary
- \`health.json\`, \`events.json\`, \`sync.json\`, \`replay.json\`

## Support
All sensitive values have been redacted. Use correlation IDs to replay events in simulation mode.
`;
  }

  private suggestNextSteps(
    health: { overallStatus?: string; components?: Array<{ name: string; status: string }> },
    failureCount: number
  ): string[] {
    const steps: string[] = [];
    if (health.overallStatus === "unhealthy") {
      steps.push("Review health.json for unhealthy components");
    }
    const oauth = health.components?.find((c) => c.name === "oauth");
    if (oauth?.status !== "healthy") {
      steps.push("Reconnect OAuth — token may be expired");
    }
    if (failureCount > 0) {
      steps.push(`Replay ${failureCount} failed webhook(s) from replay.json in simulation mode`);
    }
    if (steps.length === 0) {
      steps.push("No immediate action required — review recent events for anomalies");
    }
    return steps;
  }
}

function checksum(data: string): string {
  return createHash("sha256").update(data).digest("hex");
}
