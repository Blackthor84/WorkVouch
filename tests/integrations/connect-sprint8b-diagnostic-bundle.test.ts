import { beforeEach, describe, expect, it } from "vitest";
import {
  ConfigurationService,
  FeatureFlagService,
  StructuredLoggingService,
  createConnectRuntime,
} from "@/lib/integrations";
import { EventDispatcher } from "@/lib/integrations/events/EventDispatcher";
import { DeadLetterQueue } from "@/lib/integrations/queue/DeadLetterQueue";
import { RetryService } from "@/lib/integrations/queue/RetryService";
import { ProviderLoader, ProviderRegistry } from "@/lib/integrations/registry";
import { HealthService } from "@/lib/integrations/health/HealthService";
import { EventValidator } from "@/lib/integrations/core/validation/event-validator";
import { MockEventConsumer } from "@/lib/integrations/core/consumers/mock-event-consumer";
import { BundleRedactor, scanForSecretLeaks } from "@/lib/integrations/connect/diagnostics/bundle-redactor";
import { BundleValidator } from "@/lib/integrations/connect/diagnostics/bundle-validator";
import { BundleExporter } from "@/lib/integrations/connect/diagnostics/bundle-exporter";
import {
  DIAGNOSTIC_BUNDLE_VERSION,
  type DiagnosticBundle,
} from "@/lib/integrations/connect/diagnostics/bundle-types";
import type { ConnectRuntime } from "@/lib/integrations/connect/connect-runtime";

function buildTestRuntime(): ConnectRuntime {
  const logger = new StructuredLoggingService();
  const config = new ConfigurationService();
  const featureFlags = new FeatureFlagService();
  const retry = new RetryService(config);
  const dlq = new DeadLetterQueue(logger);
  const dispatcher = new EventDispatcher(logger, config, retry, dlq);
  const registry = new ProviderRegistry(featureFlags, logger);
  new ProviderLoader(registry).loadBuiltInProviders();

  process.env.ATS_ENABLED = "true";
  process.env.GREENHOUSE_ENABLED = "true";
  process.env.GREENHOUSE_CLIENT_ID = "gh-test-client";
  process.env.GREENHOUSE_CLIENT_SECRET = "gh-test-secret-value";

  return createConnectRuntime({
    dispatcher,
    deadLetterQueue: dlq,
    logger,
    config,
    featureFlags,
    registry,
    health: new HealthService(logger),
    validator: new EventValidator(),
    consumer: new MockEventConsumer(logger),
  });
}

async function seedConnection(runtime: ConnectRuntime, employerId: string): Promise<string> {
  const pending = await runtime.connections.createPendingConnection({
    employerAccountId: employerId,
    provider: "greenhouse",
    status: "connected",
    oauthScopes: ["harvest:read"],
    metadata: {
      sync_preferences: {
        automation: { auto_invite_enabled: true, auto_invite_trigger: "final_interview" },
      },
    },
  });

  const id = pending.connectionId;
  await runtime.connections.completeConnection({
    connectionId: id,
    tokens: {
      accessToken: "gho_super_secret_access_token_1234567890abcdef",
      refreshToken: "gho_super_secret_refresh_token_0987654321fedcba",
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      scopes: ["harvest:read"],
    },
    providerAccountId: "gh-acct-1",
    providerAccountName: "Acme Recruiting",
  });

  return id;
}

describe("WorkVouch Connect — Sprint 8B Diagnostic Bundle", () => {
  let runtime: ConnectRuntime;

  beforeEach(() => {
    runtime = buildTestRuntime();
  });

  describe("BundleRedactor", () => {
    it("redacts OAuth tokens, API keys, and marks redaction paths", () => {
      const redactor = new BundleRedactor();
      const result = redactor.redact({
        accessToken: "gho_abc123secret",
        refreshToken: "longopaquevaluewithoutspaces1234567890",
        apiKey: "sk_live_abc123",
        authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.test",
        email: "candidate@example.com",
        safeField: "Greenhouse Production",
      }) as Record<string, unknown>;

      expect(result.accessToken).toBe("[REDACTED]");
      expect(result.refreshToken).toBe("[REDACTED]");
      expect(result.apiKey).toBe("[REDACTED]");
      expect(result.authorization).toBe("[REDACTED]");
      expect(String(result.email)).toContain("@example.com");
      expect(result.safeField).toBe("Greenhouse Production");

      const redactions = redactor.getRedactions();
      expect(redactions.length).toBeGreaterThan(0);
      expect(redactions.some((r) => r.path.includes("accessToken"))).toBe(true);
    });

    it("scanForSecretLeaks finds unredacted bearer tokens", () => {
      const leaks = scanForSecretLeaks({ header: "Bearer abc123" });
      expect(leaks.length).toBeGreaterThan(0);
    });
  });

  describe("BundleExporter", () => {
    it("exports valid JSON and ZIP with PK header", () => {
      const exporter = new BundleExporter();
      const bundle = minimalBundle();

      const json = exporter.exportJson(bundle);
      expect(() => JSON.parse(json.data as string)).not.toThrow();
      expect(json.sizeBytes).toBeGreaterThan(100);

      const zip = exporter.exportZip(bundle);
      const buf = zip.data as Buffer;
      expect(buf.readUInt32LE(0)).toBe(0x04034b50);
      expect(zip.sizeBytes).toBe(buf.length);
      expect(zip.filename).toMatch(/workvouch-connect-greenhouse/);
    });
  });

  describe("DiagnosticBundleService", () => {
    it("generates a validated bundle with redacted secrets", async () => {
      const connectionId = await seedConnection(runtime, "employer-diag");

      const service = runtime.diagnosticBundles;
      const bundle = await service.generateDiagnosticBundle({
        connectionId,
        employerAccountId: "employer-diag",
      });

      expect(bundle.manifest.bundleVersion).toBe(DIAGNOSTIC_BUNDLE_VERSION);
      expect(bundle.manifest.connectionId).toBe(connectionId);
      expect(bundle.health).toBeTruthy();
      expect(bundle.replayReferences).toBeInstanceOf(Array);
      expect(bundle.readme).toContain("WorkVouch Connect Diagnostic Bundle");

      const serialized = JSON.stringify(bundle);
      expect(serialized).not.toContain("gho_super_secret");
      expect(serialized).toContain("[REDACTED]");

      const validation = service.validateDiagnosticBundle(bundle);
      expect(validation.valid).toBe(true);
      expect(validation.secretLeaks).toHaveLength(0);
    });

    it("rejects access to connections owned by another employer", async () => {
      const connectionId = await seedConnection(runtime, "employer-a");

      await expect(
        runtime.diagnosticBundles.generateDiagnosticBundle({
          connectionId,
          employerAccountId: "employer-b",
        })
      ).rejects.toThrow(/not found|access denied/i);
    });

    it("downloads ZIP bundle under performance budget for default limits", async () => {
      const connectionId = await seedConnection(runtime, "employer-perf");

      const start = Date.now();
      const exported = await runtime.diagnosticBundles.downloadDiagnosticBundle({
        connectionId,
        employerAccountId: "employer-perf",
        format: "zip",
        maxEvents: 50,
        maxLogs: 100,
      });
      const elapsed = Date.now() - start;

      expect(exported.format).toBe("zip");
      expect(exported.sizeBytes).toBeGreaterThan(500);
      expect(elapsed).toBeLessThan(5000);
    });

    it("preview returns health status and estimated size", async () => {
      const connectionId = await seedConnection(runtime, "employer-preview");

      const preview = await runtime.diagnosticBundles.previewDiagnosticBundle({
        connectionId,
        employerAccountId: "employer-preview",
      });

      expect(preview.manifest.connectionId).toBe(connectionId);
      expect(preview.estimatedSizeBytes).toBeGreaterThan(0);
      expect(["healthy", "degraded", "unhealthy", "unknown"]).toContain(preview.healthStatus);
    });
  });

  describe("BundleValidator", () => {
    it("flags incomplete bundles", () => {
      const validator = new BundleValidator();
      const invalid = validator.validate({
        ...minimalBundle(),
        manifest: { ...minimalBundle().manifest, connectionId: "" },
        connection: {},
      });

      expect(invalid.valid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThan(0);
    });
  });
});

function minimalBundle(): DiagnosticBundle {
  return {
    manifest: {
      bundleVersion: DIAGNOSTIC_BUNDLE_VERSION,
      generatedAt: new Date().toISOString(),
      connectionId: "conn-test",
      employerAccountId: "employer-test",
      provider: "greenhouse",
      connectVersion: "1.0.0",
      providerVersion: "1.0.0",
      fileCount: 12,
      redactionCount: 0,
      checksums: { bundle: "abc" },
    },
    connection: { connectionId: "conn-test", status: "connected" },
    health: { overallStatus: "healthy", overallScore: 95, components: [] },
    syncCursor: null,
    syncHistory: { items: [] },
    recentEvents: [],
    auditTrail: [],
    replayReferences: [],
    projectionState: {},
    platform: { connectVersion: "1.0.0" },
    providerManifest: { version: "1.0.0" },
    connectionConfiguration: {},
    featureFlags: {},
    environmentValidation: {},
    performanceMetrics: {},
    errorSummary: { count: 0, items: [] },
    warningSummary: { count: 0, items: [] },
    logs: [],
    redactions: [],
    readme: "# WorkVouch Connect Diagnostic Bundle\n\n## Suggested Next Steps\n- Review health.json\n",
  };
}
