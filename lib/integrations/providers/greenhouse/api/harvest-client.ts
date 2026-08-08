import type {
  GreenhouseApplication,
  GreenhouseCandidate,
  GreenhouseJob,
  GreenhouseProviderConfig,
  GreenhouseUser,
  HttpClient,
} from "../types";
import { normalizeHarvestError, parseRetryAfterMs } from "./errors";
import { IntegrationPlatformError } from "../../../utils/errors";

export interface HarvestListResult<T> {
  items: T[];
  page: number;
  perPage: number;
  hasMore: boolean;
}

export class HarvestClient {
  constructor(
    private readonly config: GreenhouseProviderConfig,
    private readonly http: HttpClient
  ) {}

  async getCurrentUser(accessToken: string): Promise<GreenhouseUser> {
    const response = await this.requestWithRetry("/users/me", accessToken);
    return JSON.parse(response.body) as GreenhouseUser;
  }

  async listUsers(accessToken: string, page = 1, perPage = 100): Promise<HarvestListResult<GreenhouseUser>> {
    return this.list<GreenhouseUser>(`/users?page=${page}&per_page=${perPage}`, accessToken, page, perPage);
  }

  async listJobs(accessToken: string, page = 1, perPage = 100, updatedAfter?: string): Promise<HarvestListResult<GreenhouseJob>> {
    const query = updatedAfter
      ? `/jobs?page=${page}&per_page=${perPage}&updated_after=${encodeURIComponent(updatedAfter)}`
      : `/jobs?page=${page}&per_page=${perPage}`;
    return this.list<GreenhouseJob>(query, accessToken, page, perPage);
  }

  async getJob(accessToken: string, jobId: string): Promise<GreenhouseJob> {
    const response = await this.requestWithRetry(`/jobs/${jobId}`, accessToken);
    return JSON.parse(response.body) as GreenhouseJob;
  }

  async listCandidates(accessToken: string, page = 1, perPage = 100, updatedAfter?: string): Promise<HarvestListResult<GreenhouseCandidate>> {
    const query = updatedAfter
      ? `/candidates?page=${page}&per_page=${perPage}&updated_after=${encodeURIComponent(updatedAfter)}`
      : `/candidates?page=${page}&per_page=${perPage}`;
    return this.list<GreenhouseCandidate>(query, accessToken, page, perPage);
  }

  async getCandidate(accessToken: string, candidateId: string): Promise<GreenhouseCandidate> {
    const response = await this.requestWithRetry(`/candidates/${candidateId}`, accessToken);
    return JSON.parse(response.body) as GreenhouseCandidate;
  }

  async listApplications(accessToken: string, page = 1, perPage = 100, updatedAfter?: string): Promise<HarvestListResult<GreenhouseApplication>> {
    const query = updatedAfter
      ? `/applications?page=${page}&per_page=${perPage}&updated_after=${encodeURIComponent(updatedAfter)}`
      : `/applications?page=${page}&per_page=${perPage}`;
    return this.list<GreenhouseApplication>(query, accessToken, page, perPage);
  }

  async getApplication(accessToken: string, applicationId: string): Promise<GreenhouseApplication> {
    const response = await this.requestWithRetry(`/applications/${applicationId}`, accessToken);
    return JSON.parse(response.body) as GreenhouseApplication;
  }

  async healthCheck(accessToken: string): Promise<{ healthy: boolean; latencyMs: number; user?: GreenhouseUser; error?: string }> {
    const started = Date.now();
    try {
      const user = await this.getCurrentUser(accessToken);
      return { healthy: true, latencyMs: Date.now() - started, user };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - started,
        error: error instanceof Error ? error.message : "Health check failed",
      };
    }
  }

  private async list<T>(path: string, accessToken: string, page: number, perPage: number): Promise<HarvestListResult<T>> {
    const response = await this.requestWithRetry(path, accessToken);
    const items = JSON.parse(response.body) as T[];
    return { items, page, perPage, hasMore: items.length >= perPage };
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
        const delay = this.config.harvest.retryBackoffMs[attempt - 1] ?? 1000;
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
