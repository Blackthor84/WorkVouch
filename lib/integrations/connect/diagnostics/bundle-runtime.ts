import type { ConnectHealthService } from "../health/connect-health-service";
import type { ConnectionManager } from "../connection/connection-manager";
import type { ConnectPlatform } from "../connect-platform";
import type { WebhookMetrics } from "../webhooks/webhook-metrics";
import type { LifecycleObservability } from "../orchestration/lifecycle-observability";
import type { HiringMetricsEngine } from "../intelligence/hiring-metrics-engine";

/** Runtime dependencies required to build a diagnostic bundle. */
export interface DiagnosticBundleRuntime {
  connections: ConnectionManager;
  health: ConnectHealthService;
  connect: ConnectPlatform;
  webhookMetrics: WebhookMetrics;
  lifecycleObservability: LifecycleObservability;
  hiringMetrics: HiringMetricsEngine;
}
