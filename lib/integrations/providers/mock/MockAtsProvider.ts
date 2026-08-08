import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import type { AtsProvider } from "../base/AtsProvider";
import type {
  ConnectParams,
  ConnectResult,
  DisconnectParams,
  HealthCheckParams,
  HealthCheckResult,
  ProviderCapabilities,
  ProviderConfiguration,
  ProviderRegistration,
  RefreshTokenParams,
  TestConnectionParams,
  TestConnectionResult,
  TokenPair,
  ValidationResult,
} from "../../types/provider";
import type {
  SyncApplicationParams,
  SyncCandidateParams,
  SyncJobParams,
  SyncResult,
} from "../../types/sync";
import type { ReceiveWebhookParams, WebhookReceiveResult } from "../../types/webhook";
import { nowIso, sleep } from "../../utils/correlation";
import {
  MOCK_APPLICATIONS,
  MOCK_CANDIDATES,
  MOCK_CONNECTIONS,
  MOCK_JOBS,
  MOCK_WEBHOOK_SECRET,
  createMockTokens,
  resetMockStore,
} from "./mock-data";

const MOCK_MANIFEST = {
  provider: "mock" as const,
  displayName: "MockATS",
  version: "1.0.0",
  apiVersion: "1.0",
  compatibleConnectVersion: "1.0.0",
  minimumConnectVersion: "1.0.0",
  maximumTestedConnectVersion: "1.0.0",
  supportsOAuth: true,
  supportsWebhooks: true,
  supportsCandidates: true,
  supportsJobs: true,
  supportsApplications: true,
  supportsCustomFields: true,
  supportsStatusSync: true,
  supportsReferenceRequests: false,
  supportsBatchSync: true,
  supportsAttachments: false,
  authenticationType: "oauth2_pkce" as const,
};

const MOCK_CAPABILITIES: ProviderCapabilities = {
  providerId: "mock",
  displayName: "MockATS",
  apiVersion: "1.0",
  features: [
    "oauth",
    "webhooks",
    "candidate_sync",
    "job_sync",
    "application_sync",
    "custom_fields",
    "bulk_export",
  ],
  supportsOAuth: true,
  supportsWebhooks: true,
  supportsBatchSync: true,
  authenticationType: "oauth2_pkce",
  rateLimits: { requestsPerWindow: 1000, windowSeconds: 10 },
};

export class MockAtsProvider implements AtsProvider {
  readonly providerId = "mock" as const;
  readonly displayName = "MockATS";

  async connect(params: ConnectParams): Promise<ConnectResult> {
    await sleep(10);

    if (!params.code) {
      return {
        connectionId: randomUUID(),
        status: "pending",
        scopes: ["mock:read", "mock:write"],
        authorizationUrl: `https://mock-ats.test/oauth/authorize?state=${params.state}`,
      };
    }

    const tokens = createMockTokens(params.employerAccountId);
    return {
      connectionId: tokens.connectionId,
      status: "connected",
      providerAccountId: "mock-org-1",
      providerAccountName: "Mock Organization",
      scopes: ["mock:read", "mock:write"],
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    };
  }

  async disconnect(params: DisconnectParams): Promise<void> {
    MOCK_CONNECTIONS.delete(params.connectionId);
  }

  async healthCheck(params: HealthCheckParams): Promise<HealthCheckResult> {
    const started = Date.now();
    await sleep(5);
    const valid = Array.from(MOCK_CONNECTIONS.entries()).some(
      ([connectionId, value]) =>
        connectionId === params.connectionId && value.accessToken === params.accessToken
    );

    return {
      healthy: valid,
      latencyMs: Date.now() - started,
      providerAccountName: valid ? "Mock Organization" : undefined,
      error: valid ? undefined : "Invalid mock access token",
      checkedAt: nowIso(),
    };
  }

  async syncCandidate(params: SyncCandidateParams): Promise<SyncResult> {
    const started = Date.now();
    await sleep(5);
    const candidate = MOCK_CANDIDATES.find(
      (item) => item.externalCandidateId === params.externalCandidateId
    );

    return {
      success: Boolean(candidate) || params.direction === "outbound",
      externalId: params.externalCandidateId,
      operation: candidate ? "update" : "create",
      status: "success",
      fieldsUpdated: params.direction === "outbound" ? ["trust_score", "trust_band"] : ["email"],
      durationMs: Date.now() - started,
    };
  }

  async syncJob(params: SyncJobParams): Promise<SyncResult> {
    const started = Date.now();
    await sleep(5);
    const job = MOCK_JOBS.find((item) => item.externalJobId === params.externalJobId);

    return {
      success: Boolean(job) || params.direction === "outbound",
      externalId: params.externalJobId,
      operation: job ? "update" : "create",
      status: "success",
      fieldsUpdated: ["title", "status"],
      durationMs: Date.now() - started,
    };
  }

  async syncApplication(params: SyncApplicationParams): Promise<SyncResult> {
    const started = Date.now();
    await sleep(5);
    const application = MOCK_APPLICATIONS.find(
      (item) => item.externalApplicationId === params.externalApplicationId
    );

    return {
      success: Boolean(application) || params.direction === "outbound",
      externalId: params.externalApplicationId,
      operation: application ? "update" : "create",
      status: "success",
      fieldsUpdated: ["status"],
      durationMs: Date.now() - started,
    };
  }

  async receiveWebhook(params: ReceiveWebhookParams): Promise<WebhookReceiveResult> {
    const signature = params.headers["x-mock-signature"] ?? params.headers["signature"] ?? "";
    const expected = createHmac("sha256", params.webhookSecret || MOCK_WEBHOOK_SECRET)
      .update(params.rawBody)
      .digest("hex");

    const normalized = signature.replace(/^sha256=/, "");
    const valid =
      normalized.length === expected.length &&
      timingSafeEqual(Buffer.from(normalized), Buffer.from(expected));

    if (!valid) {
      return { accepted: false, duplicate: false, error: "Invalid webhook signature" };
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(params.rawBody) as Record<string, unknown>;
    } catch {
      return { accepted: false, duplicate: false, error: "Invalid webhook payload" };
    }

    const eventId = String(payload.eventId ?? randomUUID());
    return {
      accepted: true,
      duplicate: false,
      event: {
        eventId,
        eventType: String(payload.eventType ?? "mock.event"),
        provider: "mock",
        externalCandidateId: payload.candidateId ? String(payload.candidateId) : undefined,
        externalJobId: payload.jobId ? String(payload.jobId) : undefined,
        externalApplicationId: payload.applicationId ? String(payload.applicationId) : undefined,
        payload,
        receivedAt: nowIso(),
      },
    };
  }

  async refreshToken(params: RefreshTokenParams): Promise<TokenPair> {
    const entry = MOCK_CONNECTIONS.get(params.connectionId);
    if (!entry || entry.refreshToken !== params.refreshToken) {
      throw new Error("Invalid refresh token");
    }

    const accessToken = `mock_access_${params.connectionId}_${Date.now()}`;
    entry.accessToken = accessToken;

    return {
      accessToken,
      refreshToken: params.refreshToken,
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      scopes: ["mock:read", "mock:write"],
    };
  }

  getCapabilities(): ProviderCapabilities {
    return MOCK_CAPABILITIES;
  }

  validateConfiguration(config: ProviderConfiguration): ValidationResult {
    const errors: string[] = [];
    if (config.providerId !== "mock") {
      errors.push("Provider ID must be mock");
    }
    return { valid: errors.length === 0, errors };
  }

  async testConnection(params: TestConnectionParams): Promise<TestConnectionResult> {
    const health = await this.healthCheck({
      connectionId: params.connectionId,
      accessToken: params.accessToken,
    });

    return {
      success: health.healthy,
      latencyMs: health.latencyMs,
      message: health.healthy ? "Mock connection successful" : "Mock connection failed",
      checkedAt: health.checkedAt,
    };
  }
}

export function createMockAtsRegistration(): ProviderRegistration {
  return {
    providerId: "mock",
    displayName: "MockATS",
    capabilities: MOCK_CAPABILITIES,
    manifest: MOCK_MANIFEST,
    factory: () => new MockAtsProvider(),
  };
}

/** Test helper */
export function resetMockAtsProviderState(): void {
  resetMockStore();
}
