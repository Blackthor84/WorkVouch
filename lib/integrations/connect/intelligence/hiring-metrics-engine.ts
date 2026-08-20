import type { ConnectEventStore } from "../event-store/connect-event-store";
import type { LifecycleObservability } from "../orchestration/lifecycle-observability";
import type { WebhookMetrics } from "../webhooks/webhook-metrics";
import { HiringMetricsCalculator } from "./hiring-metrics-calculator";
import { HiringMetricsAggregator } from "./hiring-metrics-aggregator";
import { HiringMetricsSnapshotService } from "./hiring-metrics-snapshot-service";
import { HiringMetricsScheduler } from "./hiring-metrics-scheduler";
import type { HiringMetricsRepository } from "./hiring-metrics-repository";
import { InMemoryHiringMetricsRepository } from "./in-memory-hiring-metrics-repository";
import type {
  CandidateFunnelTimeline,
  HiringMetricsBundle,
  HiringMetricsSnapshotRecord,
  MetricsQueryInput,
  MetricsPeriod,
  TrendComparison,
  AggregationLevel,
} from "./types";
import { periodToDateRange } from "./types";

export interface HiringMetricsEngineDeps {
  eventStore: ConnectEventStore;
  repository?: HiringMetricsRepository;
  lifecycleObservability?: LifecycleObservability;
  webhookMetrics?: WebhookMetrics;
}

/**
 * Hiring Intelligence Engine — measures business outcomes from Connect event store.
 * Answers: How fast? How reliable? How much time saved?
 */
export class HiringMetricsEngine {
  readonly calculator: HiringMetricsCalculator;
  readonly aggregator: HiringMetricsAggregator;
  readonly snapshots: HiringMetricsSnapshotService;
  readonly scheduler: HiringMetricsScheduler;
  private readonly repository: HiringMetricsRepository;
  private readonly eventStore: ConnectEventStore;

  constructor(deps: HiringMetricsEngineDeps) {
    this.eventStore = deps.eventStore;
    this.repository = deps.repository ?? new InMemoryHiringMetricsRepository();
    this.calculator = new HiringMetricsCalculator();
    this.aggregator = new HiringMetricsAggregator();

    this.snapshots = new HiringMetricsSnapshotService({
      eventStore: deps.eventStore,
      repository: this.repository,
      lifecycleObservability: deps.lifecycleObservability,
      webhookMetrics: deps.webhookMetrics,
    });

    this.scheduler = new HiringMetricsScheduler(this.snapshots);
  }

  /** Compute live metrics from event store (no snapshot required). */
  async computeMetrics(query: MetricsQueryInput): Promise<HiringMetricsBundle> {
    return this.snapshots.computeLive(query);
  }

  /** Build per-candidate funnel timelines. */
  async getCandidateTimelines(query: MetricsQueryInput): Promise<CandidateFunnelTimeline[]> {
    const period = query.period ?? "30d";
    const { start, end } = periodToDateRange(period);

    const events = await this.eventStore.loadTimeline({
      companyId: query.employerAccountId,
      connectionId: query.connectionId,
      fromOccurredAt: query.fromOccurredAt ?? start,
      toOccurredAt: query.toOccurredAt ?? end,
    });

    return this.calculator.buildCandidateTimelines(events);
  }

  /** Aggregate metrics across dimensions. */
  async aggregate(
    query: MetricsQueryInput,
    level: AggregationLevel
  ): Promise<Map<string, HiringMetricsBundle>> {
    const period = query.period ?? "30d";
    const { start, end } = periodToDateRange(period);

    const events = await this.eventStore.loadTimeline({
      companyId: query.employerAccountId,
      connectionId: query.connectionId,
      fromOccurredAt: start,
      toOccurredAt: end,
    });

    return this.aggregator.aggregateByLevel(events, level);
  }

  /** Generate and persist a metrics snapshot. */
  async captureSnapshot(input: {
    employerAccountId: string;
    connectionId?: string;
    period: MetricsPeriod;
  }): Promise<HiringMetricsSnapshotRecord> {
    return this.snapshots.generateSnapshot({
      ...input,
      aggregationLevel: "employer",
    });
  }

  /** Compare current period vs previous period. */
  async compareTrends(
    employerAccountId: string,
    period: MetricsPeriod,
    connectionId?: string
  ): Promise<TrendComparison | null> {
    return this.snapshots.getTrendComparison(employerAccountId, period, connectionId);
  }

  /** List historical snapshots for trend charts. */
  async listSnapshots(query: MetricsQueryInput & { limit?: number }): Promise<HiringMetricsSnapshotRecord[]> {
    return this.repository.listSnapshots(query);
  }

  /** Run scheduled snapshot capture for an employer. */
  async runScheduledSnapshots(employerAccountId: string, connectionId?: string): Promise<boolean> {
    return this.scheduler.runForEmployer(employerAccountId, connectionId);
  }
}
