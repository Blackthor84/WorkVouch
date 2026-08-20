import type { ConfigurationService, FeatureFlagService } from "../config";
import type { EventDispatcher } from "../events";
import type { HealthService } from "../health";
import type { LoggingService } from "../logging";
import type { DeadLetterQueue, RetryService } from "../queue";
import type { ProviderLoader, ProviderRegistry } from "../registry";

/**
 * Dependency container for WorkVouch Connect (internal ATS integration platform).
 * All services are injected — no global singletons in consumer code.
 */
export interface IntegrationContext {
  readonly config: ConfigurationService;
  readonly featureFlags: FeatureFlagService;
  readonly logger: LoggingService;
  readonly registry: ProviderRegistry;
  readonly providerLoader: ProviderLoader;
  readonly events: EventDispatcher;
  readonly retry: RetryService;
  readonly deadLetterQueue: DeadLetterQueue;
  readonly health: HealthService;
}

export interface IntegrationContextDeps {
  config: ConfigurationService;
  featureFlags: FeatureFlagService;
  logger: LoggingService;
  registry: ProviderRegistry;
  providerLoader: ProviderLoader;
  events: EventDispatcher;
  retry: RetryService;
  deadLetterQueue: DeadLetterQueue;
  health: HealthService;
}

export function createIntegrationContext(deps: IntegrationContextDeps): IntegrationContext {
  return {
    config: deps.config,
    featureFlags: deps.featureFlags,
    logger: deps.logger,
    registry: deps.registry,
    providerLoader: deps.providerLoader,
    events: deps.events,
    retry: deps.retry,
    deadLetterQueue: deps.deadLetterQueue,
    health: deps.health,
  };
}
