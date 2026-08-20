import type { HiringMetricsSnapshotRecord, MetricsQueryInput, MetricsPeriod } from "./types";

export interface SaveSnapshotInput {
  employerAccountId: string;
  connectionId?: string;
  provider?: HiringMetricsSnapshotRecord["provider"];
  aggregationLevel: HiringMetricsSnapshotRecord["aggregationLevel"];
  aggregationKey: string;
  period: MetricsPeriod;
  periodStart: string;
  periodEnd: string;
  metrics: HiringMetricsSnapshotRecord["metrics"];
}

export interface HiringMetricsRepository {
  saveSnapshot(input: SaveSnapshotInput): Promise<HiringMetricsSnapshotRecord>;
  getLatestSnapshot(query: MetricsQueryInput): Promise<HiringMetricsSnapshotRecord | null>;
  listSnapshots(query: MetricsQueryInput & { limit?: number }): Promise<HiringMetricsSnapshotRecord[]>;
  listByPeriod(
    employerAccountId: string,
    period: MetricsPeriod,
    limit?: number
  ): Promise<HiringMetricsSnapshotRecord[]>;
}
