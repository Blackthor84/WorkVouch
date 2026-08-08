import type { HealthCheckParams, HealthCheckResult } from "../../../types/provider";
import type { GreenhouseProviderConfig, HarvestUser, TokenStore } from "../types";
import { validateGreenhouseConfig } from "../config/greenhouse-config";
import { GREENHOUSE_OAUTH_CONFIG } from "../config/manifest";
import { HarvestClient } from "../api/harvest-client";
import { nowIso } from "../../../utils/correlation";
import { isIntegrationPlatformError } from "../../../utils/errors";

export interface GreenhouseHealthDetail {
  configuration: { ok: boolean; errors: string[]; warnings: string[] };
  oauth: { ok: boolean; message?: string };
  token: { ok: boolean; expired: boolean; expiresAt?: string; message?: string };
  scopes: { ok: boolean; missing: string[] };
  harvest: { ok: boolean; latencyMs: number; message?: string; user?: HarvestUser };
  rateLimit: { ok: boolean; message?: string };
  network: { ok: boolean; message?: string };
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
      detail.scopes.missing.length
        ? `Missing scopes: ${detail.scopes.missing.join(", ")}`
        : undefined,
    ].filter(Boolean);

    return {
      healthy,
      latencyMs: detail.harvest.latencyMs,
      providerAccountName: detail.harvest.user?.name,
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

    const oauth = {
      ok: Boolean(
        this.config.clientId &&
          this.config.clientSecret &&
          GREENHOUSE_OAUTH_CONFIG.authorizationUrl.startsWith("https://")
      ),
      message: undefined as string | undefined,
    };

    if (!oauth.ok) {
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
    };

    let harvest: GreenhouseHealthDetail["harvest"] = {
      ok: false,
      latencyMs: 0,
      message: "Harvest check skipped.",
    };

    let rateLimit = { ok: true, message: undefined as string | undefined };
    let network = { ok: true, message: undefined as string | undefined };

    if (params.accessToken && !tokenExpired) {
      try {
        const result = await this.harvest.healthCheck(params.accessToken);
        harvest = {
          ok: result.healthy,
          latencyMs: result.latencyMs,
          message: result.error,
          user: result.user,
        };
      } catch (error) {
        if (isIntegrationPlatformError(error)) {
          if (error.code === "SYNC_PROVIDER_RATE_LIMIT") {
            rateLimit = { ok: false, message: error.message };
          } else if (error.code === "NETWORK_UNREACHABLE") {
            network = { ok: false, message: error.message };
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

    return {
      configuration,
      oauth,
      token,
      scopes,
      harvest,
      rateLimit,
      network,
    };
  }
}
