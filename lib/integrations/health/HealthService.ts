import type { AtsProvider } from "../providers/base/AtsProvider";
import type {
  HealthCheckParams,
  ProviderConfiguration,
  TestConnectionParams,
} from "../types/provider";
import type {
  PlatformHealthSummary,
  ProviderHealthReport,
  ProviderHealthState,
} from "../types/health";
import type { LoggingService } from "../logging/LoggingService";
import { nowIso } from "../utils/correlation";

export interface HealthEvaluationInput {
  provider: AtsProvider;
  connectionId?: string;
  employerAccountId?: string;
  accessToken?: string;
  configuration?: ProviderConfiguration;
  lastWebhookFailure?: boolean;
  rateLimited?: boolean;
}

export class HealthService {
  constructor(private readonly logger: LoggingService) {}

  async evaluate(input: HealthEvaluationInput): Promise<ProviderHealthReport> {
    const checkedAt = nowIso();
    const issues: string[] = [];

    const configValidation = input.provider.validateConfiguration(
      input.configuration ?? { providerId: input.provider.providerId }
    );

    if (!configValidation.valid) {
      return {
        providerId: input.provider.providerId,
        connectionId: input.connectionId,
        employerAccountId: input.employerAccountId,
        state: "configuration_invalid",
        message: configValidation.errors.join("; "),
        lastCheckedAt: checkedAt,
        issues: configValidation.errors,
      };
    }

    if (input.rateLimited) {
      return this.report(input, "rate_limited", "Provider rate limit encountered.", checkedAt, [
        "rate_limit",
      ]);
    }

    if (input.lastWebhookFailure) {
      issues.push("webhook_failure");
    }

    if (!input.accessToken) {
      return this.report(input, "disconnected", "No access token available.", checkedAt, issues);
    }

    try {
      const params: HealthCheckParams = {
        connectionId: input.connectionId ?? "unknown",
        accessToken: input.accessToken,
      };
      const health = await input.provider.healthCheck(params);

      if (!health.healthy) {
        const state: ProviderHealthState = health.error?.includes("expired")
          ? "oauth_expired"
          : "degraded";
        issues.push(health.error ?? "health_check_failed");
        return this.report(
          input,
          state,
          health.error ?? "Provider health check failed.",
          checkedAt,
          issues,
          health.latencyMs
        );
      }

      if (issues.includes("webhook_failure")) {
        return this.report(
          input,
          "webhook_failure",
          "Connected but recent webhook failures detected.",
          checkedAt,
          issues,
          health.latencyMs
        );
      }

      return this.report(
        input,
        "healthy",
        "Provider connection is healthy.",
        checkedAt,
        issues,
        health.latencyMs
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Health check error";
      issues.push(message);
      return this.report(input, "offline", message, checkedAt, issues);
    }
  }

  async testConnection(
    provider: AtsProvider,
    params: TestConnectionParams
  ): Promise<ProviderHealthReport> {
    const checkedAt = nowIso();
    try {
      const result = await provider.testConnection(params);
      return {
        providerId: provider.providerId,
        connectionId: params.connectionId,
        state: result.success ? "connected" : "degraded",
        message: result.message,
        latencyMs: result.latencyMs,
        lastCheckedAt: checkedAt,
        issues: result.success ? [] : ["test_connection_failed"],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Test connection failed";
      return {
        providerId: provider.providerId,
        connectionId: params.connectionId,
        state: "offline",
        message,
        lastCheckedAt: checkedAt,
        issues: [message],
      };
    }
  }

  summarize(reports: ProviderHealthReport[]): PlatformHealthSummary {
    const hasUnhealthy = reports.some((report) =>
      ["offline", "oauth_expired", "configuration_invalid"].includes(report.state)
    );
    const hasDegraded = reports.some((report) =>
      ["degraded", "webhook_failure", "rate_limited", "disconnected"].includes(report.state)
    );

    return {
      platform: hasUnhealthy ? "unhealthy" : hasDegraded ? "degraded" : "healthy",
      providers: reports,
      checkedAt: nowIso(),
    };
  }

  private report(
    input: HealthEvaluationInput,
    state: ProviderHealthState,
    message: string,
    checkedAt: string,
    issues: string[],
    latencyMs?: number
  ): ProviderHealthReport {
    const report: ProviderHealthReport = {
      providerId: input.provider.providerId,
      connectionId: input.connectionId,
      employerAccountId: input.employerAccountId,
      state,
      message,
      latencyMs,
      lastCheckedAt: checkedAt,
      issues,
    };

    this.logger.info("Health evaluated", {
      provider: input.provider.providerId,
      event: "health.evaluated",
      companyId: input.employerAccountId,
      metadata: { state, issues },
    });

    return report;
  }
}
