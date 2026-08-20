import type { GreenhouseProviderConfig, HttpClient } from "../types";
import type {
  GreenhouseApplication,
  GreenhouseCandidate,
  GreenhouseCandidateEmployment,
  GreenhouseCustomFieldDefinition,
  GreenhouseJob,
  GreenhouseJobInterviewStage,
} from "../models";
import { parseLinkHeaderNext } from "./link-pagination";
import { normalizeHarvestError, parseRetryAfterMs } from "./errors";
import { IntegrationPlatformError } from "../../../utils/errors";

export interface HarvestCursorPage<T> {
  items: T[];
  nextUrl: string | null;
}

export interface HarvestPaginateOptions {
  perPage?: number;
  updatedAfter?: string;
  /** Resume from a prior Link header next URL (cursor-only — no other query params). */
  startUrl?: string;
  maxPages?: number;
}

export interface HarvestPaginateResult<T> {
  items: T[];
  pagesFetched: number;
  lastNextUrl: string | null;
  truncated: boolean;
}

export class HarvestClient {
  constructor(
    private readonly config: GreenhouseProviderConfig,
    private readonly http: HttpClient
  ) {}

  private get apiRoot(): string {
    return this.config.harvest.baseUrl.replace(/\/$/, "");
  }

  async healthCheck(accessToken: string): Promise<{
    healthy: boolean;
    latencyMs: number;
    probe?: string;
    error?: string;
  }> {
    const started = Date.now();
    try {
      await this.fetchPage<GreenhouseJob>(
        `${this.apiRoot}/jobs?per_page=1`,
        accessToken
      );
      return {
        healthy: true,
        latencyMs: Date.now() - started,
        probe: "GET /v3/jobs?per_page=1",
      };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - started,
        error: error instanceof Error ? error.message : "Health check failed",
      };
    }
  }

  async listCandidates(
    accessToken: string,
    options: HarvestPaginateOptions = {}
  ): Promise<HarvestPaginateResult<GreenhouseCandidate>> {
    return this.paginateResource<GreenhouseCandidate>("/candidates", accessToken, options);
  }

  async listApplications(
    accessToken: string,
    options: HarvestPaginateOptions = {}
  ): Promise<HarvestPaginateResult<GreenhouseApplication>> {
    return this.paginateResource<GreenhouseApplication>("/applications", accessToken, options);
  }

  async listJobs(
    accessToken: string,
    options: HarvestPaginateOptions = {}
  ): Promise<HarvestPaginateResult<GreenhouseJob>> {
    return this.paginateResource<GreenhouseJob>("/jobs", accessToken, options);
  }

  async listCandidateEmployments(
    accessToken: string,
    options: HarvestPaginateOptions = {}
  ): Promise<HarvestPaginateResult<GreenhouseCandidateEmployment>> {
    return this.paginateResource<GreenhouseCandidateEmployment>(
      "/candidate_employments",
      accessToken,
      options
    );
  }

  async listJobInterviewStages(
    accessToken: string,
    options: HarvestPaginateOptions = {}
  ): Promise<HarvestPaginateResult<GreenhouseJobInterviewStage>> {
    return this.paginateResource<GreenhouseJobInterviewStage>(
      "/job_interview_stages",
      accessToken,
      options
    );
  }

  async listCustomFields(
    accessToken: string,
    options: HarvestPaginateOptions = {}
  ): Promise<HarvestPaginateResult<GreenhouseCustomFieldDefinition>> {
    return this.paginateResource<GreenhouseCustomFieldDefinition>(
      "/custom_fields",
      accessToken,
      options
    );
  }

  async getCandidate(accessToken: string, candidateId: string): Promise<GreenhouseCandidate> {
    const page = await this.fetchPage<GreenhouseCandidate>(
      `${this.apiRoot}/candidates?ids=${encodeURIComponent(candidateId)}`,
      accessToken
    );
    const item = page.items[0];
    if (!item) {
      throw new IntegrationPlatformError({
        code: "SYNC_ENTITY_NOT_FOUND",
        message: `Greenhouse candidate ${candidateId} not found.`,
        retryable: false,
        provider: "greenhouse",
      });
    }
    return item;
  }

  async getJob(accessToken: string, jobId: string): Promise<GreenhouseJob> {
    const page = await this.fetchPage<GreenhouseJob>(
      `${this.apiRoot}/jobs?ids=${encodeURIComponent(jobId)}`,
      accessToken
    );
    const item = page.items[0];
    if (!item) {
      throw new IntegrationPlatformError({
        code: "SYNC_ENTITY_NOT_FOUND",
        message: `Greenhouse job ${jobId} not found.`,
        retryable: false,
        provider: "greenhouse",
      });
    }
    return item;
  }

  async getApplication(accessToken: string, applicationId: string): Promise<GreenhouseApplication> {
    const page = await this.fetchPage<GreenhouseApplication>(
      `${this.apiRoot}/applications?ids=${encodeURIComponent(applicationId)}`,
      accessToken
    );
    const item = page.items[0];
    if (!item) {
      throw new IntegrationPlatformError({
        code: "SYNC_ENTITY_NOT_FOUND",
        message: `Greenhouse application ${applicationId} not found.`,
        retryable: false,
        provider: "greenhouse",
      });
    }
    return item;
  }

  private buildInitialUrl(path: string, options: HarvestPaginateOptions): string {
    if (options.startUrl) return options.startUrl;

    const url = new URL(`${this.apiRoot}${path}`);
    const perPage = options.perPage ?? 100;
    url.searchParams.set("per_page", String(perPage));
    if (options.updatedAfter) {
      url.searchParams.set("updated_at", options.updatedAfter);
    }
    return url.toString();
  }

  private async paginateResource<T>(
    path: string,
    accessToken: string,
    options: HarvestPaginateOptions
  ): Promise<HarvestPaginateResult<T>> {
    const items: T[] = [];
    let nextUrl: string | null = this.buildInitialUrl(path, options);
    let pagesFetched = 0;
    const maxPages = options.maxPages;

    while (nextUrl) {
      pagesFetched += 1;
      const page = await this.fetchPage<T>(nextUrl, accessToken);
      items.push(...page.items);
      nextUrl = page.nextUrl;

      if (maxPages != null && pagesFetched >= maxPages) {
        return {
          items,
          pagesFetched,
          lastNextUrl: nextUrl,
          truncated: Boolean(nextUrl),
        };
      }
    }

    return { items, pagesFetched, lastNextUrl: null, truncated: false };
  }

  private async fetchPage<T>(url: string, accessToken: string): Promise<HarvestCursorPage<T>> {
    const response = await this.requestWithRetry(url, accessToken);
    const items = JSON.parse(response.body) as T[];
    const linkHeader = response.headers.link ?? response.headers.Link;
    return {
      items: Array.isArray(items) ? items : [],
      nextUrl: parseLinkHeaderNext(linkHeader),
    };
  }

  private async requestWithRetry(
    url: string,
    accessToken: string,
    attempt = 1
  ): Promise<{ status: number; headers: Record<string, string>; body: string }> {
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

      const normalized = normalizeHarvestError(response, url);

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
        return this.requestWithRetry(url, accessToken, attempt + 1);
      }

      throw normalized;
    } catch (error) {
      if (error instanceof IntegrationPlatformError) throw error;

      if (attempt < this.config.harvest.maxRetries) {
        const delay = this.config.harvest.retryBackoffMs[attempt - 1] ?? 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.requestWithRetry(url, accessToken, attempt + 1);
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
