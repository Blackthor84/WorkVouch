import type { ConnectEventStore } from "../event-store/connect-event-store";
import type { HiringMetricsRepository } from "./hiring-metrics-repository";
import { HiringMetricsCalculator } from "./hiring-metrics-calculator";
import { HiringMetricsAggregator } from "./hiring-metrics-aggregator";
import type {
  AggregationLevel,
  HiringMetricsBundle,
  HiringMetricsSnapshotRecord,
  MetricsPeriod,
  MetricsQueryInput,
  TrendComparison,
} from "./types";
import { periodToDateRange } from "./types";
import type { LifecycleObservability } from "../orchestration/lifecycle-observability";
import type { WebhookMetrics } from "../webhooks/webhook-metrics";

export interface SnapshotServiceDeps {
  eventStore: ConnectEventStore;
  repository: HiringMetricsRepository;
  lifecycleObservability?: LifecycleObservability;
  webhookMetrics?: WebhookMetrics;
}

/** Generates and persists periodic hiring metrics snapshots for trend analysis. */
export class HiringMetricsSnapshotService {
  private readonly calculator = new HiringMetricsCalculator();
  private readonly aggregator = new HiringMetricsAggregator();

  constructor(private readonly deps: SnapshotServiceDeps) {}

  async generateSnapshot(input: {
    employerAccountId: string;
    connectionId?: string;
    period: MetricsPeriod;
    aggregationLevel?: AggregationLevel;
    aggregationKey?: string;
  }): Promise<HiringMetricsSnapshotRecord> {
    const { start, end } = periodToDateRange(input.period);
    const events = await this.deps.eventStore.loadTimeline({
      companyId: input.employerAccountId,
      connectionId: input.connectionId,
      fromOccurredAt: start,
      toOccurredAt: end,
    });

    const metrics = this.calculator.calculate(events, {
      lifecycleObservability: this.deps.lifecycleObservability,
      webhookMetrics: this.deps.webhookMetrics,
    });

    const level = input.aggregationLevel ?? "employer";
    const key = input.aggregationKey ?? input.employerAccountId;

    return this.deps.repository.saveSnapshot({
      employerAccountId: input.employerAccountId,
      connectionId: input.connectionId,
      aggregationLevel: level,
      aggregationKey: key,
      period: input.period,
      periodStart: start,
      periodEnd: end,
      metrics,
    });
  }

  async generateAllPeriodSnapshots(employerAccountId: string, connectionId?: string): Promise<HiringMetricsSnapshotRecord[]> {
    const periods: MetricsPeriod[] = ["7d", "30d", "90d", "ytd", "lifetime"];
    const results: HiringMetricsSnapshotRecord[] = [];

    for (const period of periods) {
      results.push(
        await this.generateSnapshot({ employerAccountId, connectionId, period, aggregationLevel: "employer" })
      );
    }

    return results;
  }

  async getTrendComparison(
    employerAccountId: string,
    period: MetricsPeriod,
    connectionId?: string
  ): Promise<TrendComparison | null> {
    const currentRange = periodToDateRange(period);
    const previousEnd = new Date(currentRange.start);
    const previousStart = new Date(previousEnd);
    const spanMs = new Date(currentRange.end).getTime() - new Date(currentRange.start).getTime();
    previousStart.setTime(previousStart.getTime() - spanMs);

    const currentEvents = await this.deps.eventStore.loadTimeline({
      companyId: employerAccountId,
      connectionId,
      fromOccurredAt: currentRange.start,
      toOccurredAt: currentRange.end,
    });

    const previousEvents = await this.deps.eventStore.loadTimeline({
      companyId: employerAccountId,
      connectionId,
      fromOccurredAt: previousStart.toISOString(),
      toOccurredAt: previousEnd.toISOString(),
    });

    if (currentEvents.length === 0) return null;

    const current = this.calculator.calculate(currentEvents, {
      lifecycleObservability: this.deps.lifecycleObservability,
      webhookMetrics: this.deps.webhookMetrics,
    });

    const previous = this.calculator.calculate(previousEvents, {
      lifecycleObservability: this.deps.lifecycleObservability,
      webhookMetrics: this.deps.webhookMetrics,
    });

    return this.aggregator.compareTrends(current, previous, period);
  }

  async getLatest(input: MetricsQueryInput): Promise<HiringMetricsSnapshotRecord | null> {
    return this.deps.repository.getLatestSnapshot(input);
  }

  async computeLive(input: MetricsQueryInput): Promise<HiringMetricsBundle> {
    const period = input.period ?? "30d";
    const { start, end } = periodToDateRange(period);

    const events = await this.deps.eventStore.loadTimeline({
      companyId: input.employerAccountId,
      connectionId: input.connectionId,
      fromOccurredAt: input.fromOccurredAt ?? start,
      toOccurredAt: input.toOccurredAt ?? end,
    });

    return this.calculator.calculate(events, {
      lifecycleObservability: this.deps.lifecycleObservability,
      webhookMetrics: this.deps.webhookMetrics,
    });
  }
}
