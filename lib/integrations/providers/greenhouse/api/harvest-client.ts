import type { GreenhouseProviderConfig, HarvestUser, HttpClient } from "../types";
import { normalizeHarvestError, parseRetryAfterMs } from "./errors";
import { IntegrationPlatformError } from "../../../utils/errors";

export class HarvestClient {
  constructor(
    private readonly config: GreenhouseProviderConfig,
    private readonly http: HttpClient
  ) {}

  async getCurrentUser(accessToken: string): Promise<HarvestUser> {
    const response = await this.requestWithRetry("/users/me", accessToken);
    return JSON.parse(response.body) as HarvestUser;
  }

  async healthCheck(accessToken: string): Promise<{ healthy: boolean; latencyMs: number; user?: HarvestUser; error?: string }> {
    const started = Date.now();
    try {
      const user = await this.getCurrentUser(accessToken);
      return {
        healthy: true,
        latencyMs: Date.now() - started,
        user,
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - started,
        error: error instanceof Error ? error.message : "Health check failed",
      };
    }
  }

  private async requestWithRetry(path: string, accessToken: string, attempt = 1): Promise<{ status: number; headers: Record<string, string>; body: string }> {
    const url = `${this.config.harvest.baseUrl}${path}`;

    try {
      const response = await this.http.request(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        timeoutMs: this.config.harvest.timeoutMs,
      });

      if (response.status >= 200 && response.status < 300) {
        return response;
      }

      const normalized = normalizeHarvestError(response, path);

      if (
        normalized.retryable &&
        attempt < this.config.harvest.maxRetries &&
        (response.status === 429 || response.status >= 500)
      ) {
        const retryAfterMs =
          parseRetryAfterMs(response) ??
          this.config.harvest.retryBackoffMs[attempt - 1] ??
          1000;
        await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
        return this.requestWithRetry(path, accessToken, attempt + 1);
      }

      throw normalized;
    } catch (error) {
      if (error instanceof IntegrationPlatformError) throw error;

      if (attempt < this.config.harvest.maxRetries) {
        const delay =
          this.config.harvest.retryBackoffMs[attempt - 1] ?? 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.requestWithRetry(path, accessToken, attempt + 1);
      }

      throw new IntegrationPlatformError({
        code: "NETWORK_UNREACHABLE",
        message: error instanceof Error ? error.message : "Harvest API unreachable",
        retryable: true,
        provider: "greenhouse",
      });
    }
  }
}
