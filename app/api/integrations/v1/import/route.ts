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

/** POST /api/integrations/v1/import — trigger Harvest import for a connection */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { connectionId?: string; employerAccountId?: string; maxPages?: number };
    if (!body.connectionId || !body.employerAccountId) {
      return NextResponse.json({ error: "connectionId and employerAccountId required" }, { status: 400 });
    }

    const runtime = getRuntime();
    await runtime.recovery.ensureValidToken(body.connectionId).catch(() => null);

    const result = await runtime.harvestImport.importAll({
      connectionId: body.connectionId,
      employerAccountId: body.employerAccountId,
      maxPages: body.maxPages ?? 5,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
