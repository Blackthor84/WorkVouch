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
import { verifyGreenhouseWebhookSignature } from "./auth/webhook-signature";
import { buildIdempotencyKey, parseGreenhouseWebhook } from "./mappers/webhookMapper";
import { nowIso } from "../../utils/correlation";
import type {
  GreenhouseProviderConfig,
  HttpClient,
  OAuthStateStore,
  TokenStore,
} from "./types";
import {
  resolveGreenhouseConfig,
  validateGreenhouseConfig,
} from "./config/greenhouse-config";
import { GREENHOUSE_PROVIDER_CAPABILITIES, GREENHOUSE_MANIFEST } from "./config/manifest";
import { FetchHttpClient } from "./api/http-client";
import { HarvestClient } from "./api/harvest-client";
import { GreenhouseOAuthService } from "./auth/oauth-service";
import { InMemoryOAuthStateStore } from "./auth/oauth-state-store";
import {
  AesSecureTokenStorage,
  EncryptedTokenStore,
  InMemoryTokenStore,
} from "./auth/token-store";
import { GreenhouseHealthService } from "./health/greenhouse-health-service";
import { generateCodeVerifier, generateOAuthState } from "./auth/pkce";
import type { ConnectionManager } from "../../connect/connection/connection-manager";
import type { HarvestImportService } from "./sync/harvest-import-service";
import { mapGreenhouseCandidate } from "./mappers/candidateMapper";
import { mapGreenhouseJob } from "./mappers/jobMapper";
import { mapGreenhouseApplication } from "./mappers/applicationMapper";

export interface GreenhouseProviderDeps {
  config?: GreenhouseProviderConfig;
  http?: HttpClient;
  tokenStore?: TokenStore;
  stateStore?: OAuthStateStore;
  oauth?: GreenhouseOAuthService;
  harvest?: HarvestClient;
  health?: GreenhouseHealthService;
  connectionManager?: ConnectionManager;
  harvestImport?: HarvestImportService;
}

export class GreenhouseProvider implements AtsProvider {
  readonly providerId = "greenhouse" as const;
  readonly displayName = "Greenhouse";

  private readonly config: GreenhouseProviderConfig;
  private readonly oauth: GreenhouseOAuthService;
  private readonly harvest: HarvestClient;
  private readonly tokenStore: TokenStore;
  private readonly healthService: GreenhouseHealthService;
  private readonly connectionManager?: ConnectionManager;
  private readonly harvestImport?: HarvestImportService;

  constructor(deps: GreenhouseProviderDeps = {}) {
    this.config = deps.config ?? resolveGreenhouseConfig();
    const http = deps.http ?? new FetchHttpClient();
    this.tokenStore =
      deps.tokenStore ??
      new EncryptedTokenStore(new InMemoryTokenStore(), new AesSecureTokenStorage());
    const stateStore = deps.stateStore ?? new InMemoryOAuthStateStore();
    this.oauth =
      deps.oauth ?? new GreenhouseOAuthService(this.config, http, this.tokenStore, stateStore);
    this.harvest = deps.harvest ?? new HarvestClient(this.config, http);
    this.healthService =
      deps.health ?? new GreenhouseHealthService(this.config, this.harvest, this.tokenStore);
    this.connectionManager = deps.connectionManager;
    this.harvestImport = deps.harvestImport;
  }

  async connect(params: ConnectParams): Promise<ConnectResult> {
    if (!params.code) {
      if (this.connectionManager) {
      const pkceRequired = this.config.oauth.pkceRequired;
      const state = params.state || generateOAuthState();
      const codeVerifier = pkceRequired
        ? params.codeVerifier ?? generateCodeVerifier()
        : params.codeVerifier ?? "";
        const pending = await this.connectionManager.startOAuth({
          employerAccountId: params.employerAccountId,
          provider: "greenhouse",
          redirectUri: params.redirectUri,
          requiredScopes: this.config.oauth.scopes,
          codeVerifier,
          state,
        });
        return this.oauth.startConnect({ ...params, connectionId: pending.connectionId, state, codeVerifier });
      }
      return this.oauth.startConnect(params);
    }

    const result = await this.oauth.completeConnect(params);
    if (this.connectionManager) {
      await this.connectionManager.testConnection(result.connectionId, async (accessToken) => {
        const probe = await this.harvest.healthCheck(accessToken);
        return {
          success: probe.healthy,
          message: probe.healthy
            ? probe.probe ?? "Harvest V3 API reachable"
            : probe.error ?? "Connection test failed",
        };
      });
    }
    return result;
  }

  async disconnect(params: DisconnectParams): Promise<void> {
    const connection = await this.tokenStore.getConnection(params.connectionId);
    if (!connection) return;

    if (params.revokeToken !== false && connection.accessToken) {
      await this.oauth.revoke(connection.accessToken);
    }

    await this.tokenStore.deleteConnection(params.connectionId);
  }

  async healthCheck(params: HealthCheckParams): Promise<HealthCheckResult> {
    return this.healthService.check(params);
  }

  async refreshToken(params: RefreshTokenParams): Promise<TokenPair> {
    return this.oauth.refresh(params.refreshToken, params.connectionId);
  }

  getCapabilities(): ProviderCapabilities {
    return GREENHOUSE_PROVIDER_CAPABILITIES;
  }

  validateConfiguration(config: ProviderConfiguration): ValidationResult {
    if (config.providerId && config.providerId !== "greenhouse") {
      return { valid: false, errors: ["Provider ID must be greenhouse"] };
    }
    return validateGreenhouseConfig(config);
  }

  async testConnection(params: TestConnectionParams): Promise<TestConnectionResult> {
    const started = Date.now();
    try {
      const probe = await this.harvest.healthCheck(params.accessToken);
      return {
        success: probe.healthy,
        latencyMs: Date.now() - started,
        message: probe.healthy
          ? probe.probe ?? "Harvest V3 API reachable"
          : probe.error ?? "Connection test failed",
        checkedAt: nowIso(),
      };
    } catch (error) {
      return {
        success: false,
        latencyMs: Date.now() - started,
        message: error instanceof Error ? error.message : "Connection test failed",
        checkedAt: nowIso(),
      };
    }
  }

  async syncCandidate(params: SyncCandidateParams): Promise<SyncResult> {
    const started = Date.now();
    try {
      const raw = await this.harvest.getCandidate(params.accessToken, params.externalCandidateId);
      const universal = mapGreenhouseCandidate(raw);
      return {
        success: true,
        externalId: universal.externalId,
        operation: "update",
        status: "success",
        fieldsUpdated: Object.keys(universal),
        durationMs: Date.now() - started,
      };
    } catch (error) {
      return {
        success: false,
        externalId: params.externalCandidateId,
        operation: "update",
        status: "error",
        durationMs: Date.now() - started,
        error: { code: "SYNC_FAILED", message: error instanceof Error ? error.message : "Sync failed", retryable: true },
      };
    }
  }

  async syncJob(params: SyncJobParams): Promise<SyncResult> {
    const started = Date.now();
    try {
      const raw = await this.harvest.getJob(params.accessToken, params.externalJobId);
      const universal = mapGreenhouseJob(raw);
      return {
        success: true,
        externalId: universal.externalId,
        operation: "update",
        status: "success",
        fieldsUpdated: Object.keys(universal),
        durationMs: Date.now() - started,
      };
    } catch (error) {
      return {
        success: false,
        externalId: params.externalJobId,
        operation: "update",
        status: "error",
        durationMs: Date.now() - started,
        error: { code: "SYNC_FAILED", message: error instanceof Error ? error.message : "Sync failed", retryable: true },
      };
    }
  }

  async syncApplication(params: SyncApplicationParams): Promise<SyncResult> {
    const started = Date.now();
    try {
      const raw = await this.harvest.getApplication(params.accessToken, params.externalApplicationId);
      const universal = mapGreenhouseApplication(raw);
      return {
        success: true,
        externalId: universal.externalId,
        operation: "update",
        status: "success",
        fieldsUpdated: Object.keys(universal),
        durationMs: Date.now() - started,
      };
    } catch (error) {
      return {
        success: false,
        externalId: params.externalApplicationId,
        operation: "update",
        status: "error",
        durationMs: Date.now() - started,
        error: { code: "SYNC_FAILED", message: error instanceof Error ? error.message : "Sync failed", retryable: true },
      };
    }
  }

  async receiveWebhook(params: ReceiveWebhookParams): Promise<WebhookReceiveResult> {
    const signature =
      params.headers["signature"] ??
      params.headers["Signature"] ??
      params.headers["x-greenhouse-signature"] ??
      "";

    const valid = verifyGreenhouseWebhookSignature(
      params.rawBody,
      signature,
      params.webhookSecret || this.config.webhookSecret || ""
    );

    if (!valid) {
      return { accepted: false, duplicate: false, error: "Invalid webhook signature" };
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(params.rawBody) as Record<string, unknown>;
    } catch {
      return { accepted: false, duplicate: false, error: "Invalid webhook payload" };
    }

    const webhook = parseGreenhouseWebhook(payload);
    const eventId = buildIdempotencyKey(webhook);

    return {
      accepted: true,
      duplicate: false,
      event: {
        eventId,
        eventType: webhook.action,
        provider: "greenhouse",
        externalCandidateId: webhook.payload.candidate_id
          ? String(webhook.payload.candidate_id)
          : undefined,
        externalApplicationId: webhook.payload.id ? String(webhook.payload.id) : undefined,
        payload: webhook.payload,
        receivedAt: nowIso(),
      },
    };
  }
}

export function createGreenhouseProvider(deps?: GreenhouseProviderDeps): GreenhouseProvider {
  return new GreenhouseProvider(deps);
}

export function createGreenhouseRegistration(
  deps?: GreenhouseProviderDeps
): ProviderRegistration {
  return {
    providerId: "greenhouse",
    displayName: "Greenhouse",
    capabilities: GREENHOUSE_PROVIDER_CAPABILITIES,
    manifest: GREENHOUSE_MANIFEST,
    factory: () => createGreenhouseProvider(deps),
  };
}
