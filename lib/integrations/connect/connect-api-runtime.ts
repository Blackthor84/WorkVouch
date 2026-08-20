import { admin } from "@/lib/supabase-admin";
import {
  ConfigurationService,
  FeatureFlagService,
  StructuredLoggingService,
  createConnectRuntime,
} from "@/lib/integrations";
import { EventDispatcher } from "@/lib/integrations/events/EventDispatcher";
import { createDeadLetterQueue } from "@/lib/integrations/queue/DeadLetterQueue";
import { SupabaseDeadLetterStore } from "@/lib/integrations/queue/supabase-dead-letter-store";
import { RetryService } from "@/lib/integrations/queue/RetryService";
import { ProviderLoader, ProviderRegistry } from "@/lib/integrations/registry";
import { HealthService } from "@/lib/integrations/health/HealthService";
import { EventValidator } from "@/lib/integrations/core/validation/event-validator";
import { MockEventConsumer } from "@/lib/integrations/core/consumers/mock-event-consumer";
import { createSentryLogSink } from "@/lib/integrations/logging/production-sink";
import { assertConnectEnvReady, isConnectEnabledInEnv, isProductionNodeEnv } from "@/lib/integrations/config/connect-env";

let envValidated = false;

function ensureConnectEnvValidated(): void {
  if (envValidated) return;
  if (isProductionNodeEnv() && isConnectEnabledInEnv()) {
    assertConnectEnvReady();
  }
  envValidated = true;
}

/** Shared Connect runtime factory for integration API routes. */
export function getConnectApiRuntime() {
  ensureConnectEnvValidated();

  const logger = new StructuredLoggingService({ sink: createSentryLogSink() });
  const config = new ConfigurationService();
  const featureFlags = new FeatureFlagService();
  const retry = new RetryService(config);
  const dlqStore = new SupabaseDeadLetterStore(admin);
  const dlq = createDeadLetterQueue(logger, dlqStore);
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
