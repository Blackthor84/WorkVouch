import { NextResponse } from "next/server";
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

function getRuntime() {
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

/** GET /api/integrations/v1/health?connectionId=... */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get("connectionId");
    if (!connectionId) {
      return NextResponse.json({ error: "connectionId required" }, { status: 400 });
    }

    const runtime = getRuntime();
    const report = await runtime.health.evaluate(connectionId);
    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Health check failed" },
      { status: 500 }
    );
  }
}
