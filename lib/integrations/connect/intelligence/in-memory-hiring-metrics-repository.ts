import { randomUUID } from "crypto";
import { nowIso } from "../../utils/correlation";
import type { HiringMetricsRepository, SaveSnapshotInput } from "./hiring-metrics-repository";
import type { HiringMetricsSnapshotRecord, MetricsQueryInput, MetricsPeriod } from "./types";

export class InMemoryHiringMetricsRepository implements HiringMetricsRepository {
  private readonly snapshots: HiringMetricsSnapshotRecord[] = [];

  async saveSnapshot(input: SaveSnapshotInput): Promise<HiringMetricsSnapshotRecord> {
    const row: HiringMetricsSnapshotRecord = {
      id: randomUUID(),
      ...input,
      createdAt: nowIso(),
    };
    this.snapshots.push(row);
    return { ...row };
  }

  async getLatestSnapshot(query: MetricsQueryInput): Promise<HiringMetricsSnapshotRecord | null> {
    const matches = this.match(query);
    return matches.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
  }

  async listSnapshots(query: MetricsQueryInput & { limit?: number }): Promise<HiringMetricsSnapshotRecord[]> {
    const matches = this.match(query).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return matches.slice(0, query.limit ?? 50).map((s) => ({ ...s }));
  }

  async listByPeriod(
    employerAccountId: string,
    period: MetricsPeriod,
    limit = 20
  ): Promise<HiringMetricsSnapshotRecord[]> {
    return this.snapshots
      .filter((s) => s.employerAccountId === employerAccountId && s.period === period)
      .sort((a, b) => b.periodStart.localeCompare(a.periodStart))
      .slice(0, limit)
      .map((s) => ({ ...s }));
  }

  clear(): void {
    this.snapshots.length = 0;
  }

  private match(query: MetricsQueryInput): HiringMetricsSnapshotRecord[] {
    return this.snapshots.filter((s) => {
      if (s.employerAccountId !== query.employerAccountId) return false;
      if (query.connectionId && s.connectionId !== query.connectionId) return false;
      if (query.provider && s.provider !== query.provider) return false;
      if (query.period && s.period !== query.period) return false;
      if (query.aggregationLevel && s.aggregationLevel !== query.aggregationLevel) return false;
      if (query.aggregationKey && s.aggregationKey !== query.aggregationKey) return false;
      return true;
    });
  }
}
