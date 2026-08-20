import {
  ConfigurationService,
  FeatureFlagService,
} from "../config";
import { EventDispatcher } from "../events";
import { HealthService } from "../health";
import { StructuredLoggingService } from "../logging";
import { DeadLetterQueue, RetryService } from "../queue";
import { ProviderLoader, ProviderRegistry } from "../registry";
import type { AtsProviderId } from "../types";
import type { ConnectParams, ProviderConfiguration } from "../types/provider";
import type { PublishEventInput } from "../types/events";
import { createCorrelationId } from "../utils/correlation";
import { IntegrationPlatformError } from "../utils/errors";
import {
  createIntegrationContext,
  type IntegrationContext,
  type IntegrationContextDeps,
} from "./IntegrationContext";

export interface IntegrationManagerOptions {
  deps?: Partial<IntegrationContextDeps>;
  loadBuiltInProviders?: boolean;
}

/**
 * Top-level orchestrator for provider-agnostic ATS integration operations.
 */
export class IntegrationManager {
  readonly context: IntegrationContext;

  constructor(options: IntegrationManagerOptions = {}) {
    const logger = options.deps?.logger ?? new StructuredLoggingService();
    const config = options.deps?.config ?? new ConfigurationService();
    const featureFlags = options.deps?.featureFlags ?? new FeatureFlagService();
    const retry = options.deps?.retry ?? new RetryService(config);
    const deadLetterQueue = options.deps?.deadLetterQueue ?? new DeadLetterQueue(logger);
    const events =
      options.deps?.events ??
      new EventDispatcher(logger, config, retry, deadLetterQueue);
    const registry =
      options.deps?.registry ?? new ProviderRegistry(featureFlags, logger);
    const providerLoader = options.deps?.providerLoader ?? new ProviderLoader(registry);
    const health = options.deps?.health ?? new HealthService(logger);

    this.context = createIntegrationContext({
      config,
      featureFlags,
      logger,
      registry,
      providerLoader,
      events,
      retry,
      deadLetterQueue,
      health,
    });

    if (options.loadBuiltInProviders !== false) {
      this.context.providerLoader.loadBuiltInProviders();
    }
  }

  assertPlatformEnabled(): void {
    if (!this.context.featureFlags.isEnabled("ATS_ENABLED")) {
      throw new IntegrationPlatformError({
        code: "PLATFORM_DISABLED",
        message: "WorkVouch Connect is disabled.",
        retryable: false,
      });
    }
  }

  getProvider(providerId: AtsProviderId) {
    this.assertPlatformEnabled();
    return this.context.registry.getProvider(providerId);
  }

  listProviders() {
    return this.context.registry.listProviders();
  }

  async connect(providerId: AtsProviderId, params: ConnectParams) {
    const correlationId = createCorrelationId("connect");
    const provider = this.getProvider(providerId);
    const configuration =
      params.configuration ?? this.context.config.getProviderConfiguration(providerId);

    const validation = provider.validateConfiguration(configuration ?? { providerId });
    if (!validation.valid) {
      throw new IntegrationPlatformError({
        code: "PROVIDER_CONFIG_INVALID",
        message: validation.errors.join("; "),
        retryable: false,
        provider: providerId,
      });
    }

    const started = Date.now();
    const result = await provider.connect({ ...params, configuration });
    this.context.logger.info("Provider connect completed", {
      provider: providerId,
      correlationId,
      companyId: params.employerAccountId,
      event: "provider.connect",
      metadata: { durationMs: Date.now() - started, status: result.status },
    });
    return result;
  }

  publishEvent<TPayload = Record<string, unknown>>(input: PublishEventInput<TPayload>) {
    this.assertPlatformEnabled();
    return this.context.events.publish(input);
  }

  async checkHealth(
    providerId: AtsProviderId,
    input: {
      connectionId?: string;
      employerAccountId?: string;
      accessToken?: string;
      configuration?: ProviderConfiguration;
      lastWebhookFailure?: boolean;
      rateLimited?: boolean;
    }
  ) {
    const provider = this.getProvider(providerId);
    const configuration =
      input.configuration ?? this.context.config.getProviderConfiguration(providerId);
    return this.context.health.evaluate({
      provider,
      ...input,
      configuration,
    });
  }

  getPlatformHealth() {
    const reports = this.listProviders()
      .filter((provider) => provider.enabled)
      .map((provider) => ({
        providerId: provider.providerId,
        connectionId: undefined,
        employerAccountId: undefined,
        state: "disconnected" as const,
        message: "No active connection evaluated.",
        lastCheckedAt: new Date().toISOString(),
        issues: [],
      }));
    return this.context.health.summarize(reports);
  }
}

let defaultManager: IntegrationManager | null = null;

/** Optional process-level accessor for routes/cron in later sprints. */
export function getIntegrationManager(): IntegrationManager {
  if (!defaultManager) {
    defaultManager = new IntegrationManager();
  }
  return defaultManager;
}

export function resetIntegrationManager(): void {
  defaultManager = null;
}
