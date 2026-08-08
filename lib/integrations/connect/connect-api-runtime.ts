import { admin } from "@/lib/supabase-admin";
import {
  ConfigurationService,
  FeatureFlagService,
  StructuredLoggingService,
  createConnectRuntime,
} from "@/lib/integrations";
import { EventDispatcher } from "@/lib/integrations/events/EventDispatcher";
import { DeadLetterQueue } from "@/lib/integrations/queue/DeadLetterQueue";
import { RetryService } from "@/lib/integrations/queue/RetryService";
import { ProviderLoader, ProviderRegistry } from "@/lib/integrations/registry";
import { HealthService } from "@/lib/integrations/health/HealthService";
import { EventValidator } from "@/lib/integrations/core/validation/event-validator";
import { MockEventConsumer } from "@/lib/integrations/core/consumers/mock-event-consumer";

/** Shared Connect runtime factory for integration API routes. */
export function getConnectApiRuntime() {
  const logger = new StructuredLoggingService();
  const config = new ConfigurationService();
  const featureFlags = new FeatureFlagService();
  const retry = new RetryService(config);
  const dlq = new DeadLetterQueue(logger);
  const dispatcher = new EventDispatcher(logger, config, retry, dlq);
  const registry = new ProviderRegistry(featureFlags, logger);
  new ProviderLoader(registry).loadBuiltInProviders();

  return createConnectRuntime({
    supabase: admin,
    dispatcher,
    deadLetterQueue: dlq,
    logger,
    config,
    featureFlags,
    registry,
    health: new HealthService(logger),
    validator: new EventValidator(),
    consumer: new MockEventConsumer(logger),
  });
}
