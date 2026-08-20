import type { HealthCheckParams, HealthCheckResult } from "../../../types/provider";
import type { GreenhouseProviderConfig, TokenStore } from "../types";
import { validateGreenhouseConfig } from "../config/greenhouse-config";
import { GREENHOUSE_OAUTH_CONFIG } from "../config/manifest";
import { HarvestClient } from "../api/harvest-client";
import { nowIso } from "../../../utils/correlation";
import { isIntegrationPlatformError } from "../../../utils/errors";

export interface GreenhouseHealthDetail {
  configuration: { ok: boolean; errors: string[]; warnings: string[] };
  oauth: { ok: boolean; message?: string; partnerOAuth?: boolean; v3Api?: boolean };
  token: { ok: boolean; expired: boolean; expiresAt?: string; message?: string };
  scopes: { ok: boolean; missing: string[]; granted: string[] };
  harvest: { ok: boolean; latencyMs: number; message?: string; probe?: string };
  rateLimit: { ok: boolean; message?: string };
  network: { ok: boolean; message?: string };
  pagination: { ok: boolean; message?: string };
  webhooks: { ok: boolean; message?: string };
}

export class GreenhouseHealthService {
  constructor(
    private readonly config: GreenhouseProviderConfig,
    private readonly harvest: HarvestClient,
    private readonly tokenStore: TokenStore
  ) {}

  async check(params: HealthCheckParams): Promise<HealthCheckResult> {
    const detail = await this.evaluateDetail(params);
    const healthy =
      detail.configuration.ok &&
      detail.oauth.ok &&
      detail.token.ok &&
      detail.scopes.ok &&
      detail.harvest.ok &&
      detail.rateLimit.ok &&
      detail.network.ok;

    const errors = [
      ...detail.configuration.errors,
      detail.oauth.message,
      detail.token.message,
      detail.harvest.message,
      detail.rateLimit.message,
      detail.network.message,
      detail.pagination.message,
      detail.scopes.missing.length
        ? `Missing scopes: ${detail.scopes.missing.join(", ")}`
        : undefined,
    ].filter(Boolean);

    return {
      healthy,
      latencyMs: detail.harvest.latencyMs,
      providerAccountName: detail.harvest.probe,
      error: healthy ? undefined : errors.join("; "),
      checkedAt: nowIso(),
    };
  }

  async evaluateDetail(params: HealthCheckParams): Promise<GreenhouseHealthDetail> {
    const configResult = validateGreenhouseConfig({
      providerId: "greenhouse",
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      webhookSecret: this.config.webhookSecret,
      baseUrl: this.config.harvest.baseUrl,
    });

    const configuration = {
      ok: configResult.valid,
      errors: configResult.errors,
      warnings: configResult.warnings ?? [],
    };

    const partnerOAuth =
      GREENHOUSE_OAUTH_CONFIG.authorizationUrl === "https://auth.greenhouse.io/authorize" &&
      GREENHOUSE_OAUTH_CONFIG.tokenUrl === "https://auth.greenhouse.io/token";
    const v3Api = this.config.harvest.baseUrl.includes("/v3");

    const oauth = {
      ok: Boolean(this.config.clientId && this.config.clientSecret && partnerOAuth && v3Api),
      partnerOAuth,
      v3Api,
      message: undefined as string | undefined,
    };

    if (!partnerOAuth) {
      oauth.message = "OAuth endpoints must use Partner OAuth URLs (/authorize, /token).";
    } else if (!v3Api) {
      oauth.message = "Harvest base URL must target /v3.";
    } else if (!oauth.ok) {
      oauth.message = "Greenhouse OAuth configuration is incomplete.";
    }

    const connection = await this.tokenStore.getConnection(params.connectionId);
    const tokenExpiresAt = connection?.expiresAt;
    const tokenExpired = tokenExpiresAt
      ? new Date(tokenExpiresAt).getTime() <= Date.now()
      : false;

    const token = {
      ok: Boolean(params.accessToken) && !tokenExpired,
      expired: tokenExpired,
      expiresAt: tokenExpiresAt,
      message: !params.accessToken
        ? "Access token missing."
        : tokenExpired
          ? "Access token expired."
          : undefined,
    };

    const grantedScopes = connection?.scopes ?? [];
    const requiredScopes = this.config.oauth.scopes.filter((scope) =>
      scope.startsWith("harvest:")
    );
    const missing = requiredScopes.filter((scope) => !grantedScopes.includes(scope));

    const scopes = {
      ok: missing.length === 0 || grantedScopes.length === 0,
      missing,
      granted: grantedScopes,
    };

    let harvest: GreenhouseHealthDetail["harvest"] = {
      ok: false,
      latencyMs: 0,
      message: "Harvest check skipped.",
    };

    let rateLimit = { ok: true, message: undefined as string | undefined };
    let network = { ok: true, message: undefined as string | undefined };
    let pagination = { ok: true, message: undefined as string | undefined };

    if (params.accessToken && !tokenExpired) {
      try {
        const result = await this.harvest.healthCheck(params.accessToken);
        harvest = {
          ok: result.healthy,
          latencyMs: result.latencyMs,
          message: result.error,
          probe: result.probe,
        };
      } catch (error) {
        if (isIntegrationPlatformError(error)) {
          if (error.code === "SYNC_PROVIDER_RATE_LIMIT") {
            rateLimit = { ok: false, message: error.message };
          } else if (error.code === "NETWORK_UNREACHABLE") {
            network = { ok: false, message: error.message };
          } else if (error.message.toLowerCase().includes("pagination")) {
            pagination = { ok: false, message: error.message };
          } else {
            harvest = {
              ok: false,
              latencyMs: 0,
              message: error.message,
            };
          }
        } else {
          network = {
            ok: false,
            message: error instanceof Error ? error.message : "Network error",
          };
        }
      }
    }

    const webhooks = {
      ok: Boolean(this.config.webhookSecret),
      message: this.config.webhookSecret
        ? undefined
        : "Webhook secret not configured — Hookshot ingress unverified.",
    };

    return {
      configuration,
      oauth,
      token,
      scopes,
      harvest,
      rateLimit,
      network,
      pagination,
      webhooks,
    };
  }
}
