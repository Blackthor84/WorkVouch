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
import { NotImplementedYetError } from "../../utils/errors";
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
import { GREENHOUSE_PROVIDER_CAPABILITIES } from "./config/manifest";
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

export interface GreenhouseProviderDeps {
  config?: GreenhouseProviderConfig;
  http?: HttpClient;
  tokenStore?: TokenStore;
  stateStore?: OAuthStateStore;
  oauth?: GreenhouseOAuthService;
  harvest?: HarvestClient;
  health?: GreenhouseHealthService;
}

export class GreenhouseProvider implements AtsProvider {
  readonly providerId = "greenhouse" as const;
  readonly displayName = "Greenhouse";

  private readonly config: GreenhouseProviderConfig;
  private readonly oauth: GreenhouseOAuthService;
  private readonly harvest: HarvestClient;
  private readonly tokenStore: TokenStore;
  private readonly healthService: GreenhouseHealthService;

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
  }

  async connect(params: ConnectParams): Promise<ConnectResult> {
    if (!params.code) {
      return this.oauth.startConnect(params);
    }
    return this.oauth.completeConnect(params);
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
      const user = await this.harvest.getCurrentUser(params.accessToken);
      return {
        success: true,
        latencyMs: Date.now() - started,
        message: `Connected as ${user.name} (${user.email})`,
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

  async syncCandidate(_params: SyncCandidateParams): Promise<SyncResult> {
    throw new NotImplementedYetError("greenhouse", "syncCandidate");
  }

  async syncJob(_params: SyncJobParams): Promise<SyncResult> {
    throw new NotImplementedYetError("greenhouse", "syncJob");
  }

  async syncApplication(_params: SyncApplicationParams): Promise<SyncResult> {
    throw new NotImplementedYetError("greenhouse", "syncApplication");
  }

  async receiveWebhook(_params: ReceiveWebhookParams): Promise<WebhookReceiveResult> {
    throw new NotImplementedYetError("greenhouse", "receiveWebhook");
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
    factory: () => createGreenhouseProvider(deps),
  };
}
