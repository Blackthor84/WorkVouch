import type { HiringMetricsSnapshotService } from "./hiring-metrics-snapshot-service";
import type { MetricsPeriod } from "./types";

export interface SchedulerConfig {
  /** Default periods to snapshot on each scheduled run. */
  periods: MetricsPeriod[];
  /** Minimum interval between runs for the same employer (ms). */
  minIntervalMs: number;
}

const DEFAULT_CONFIG: SchedulerConfig = {
  periods: ["day", "7d", "30d"],
  minIntervalMs: 60 * 60 * 1000,
};

/** Schedules periodic hiring metrics snapshot generation. */
export class HiringMetricsScheduler {
  private readonly lastRun = new Map<string, number>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly snapshotService: HiringMetricsSnapshotService,
    private readonly config: SchedulerConfig = DEFAULT_CONFIG
  ) {}

  /** Register interval-based snapshot generation (e.g. hourly). */
  start(intervalMs = 3_600_000, employerIds: string[] = []): void {
    this.stop();
    this.timer = setInterval(() => {
      void this.runForEmployers(employerIds);
    }, intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runForEmployers(employerIds: string[]): Promise<number> {
    let count = 0;
    for (const employerAccountId of employerIds) {
      if (await this.runForEmployer(employerAccountId)) count += 1;
    }
    return count;
  }

  async runForEmployer(employerAccountId: string, connectionId?: string): Promise<boolean> {
    const key = `${employerAccountId}:${connectionId ?? "all"}`;
    const now = Date.now();
    const last = this.lastRun.get(key) ?? 0;

    if (now - last < this.config.minIntervalMs) return false;

    for (const period of this.config.periods) {
      await this.snapshotService.generateSnapshot({
        employerAccountId,
        connectionId,
        period,
        aggregationLevel: "employer",
      });
    }

    this.lastRun.set(key, now);
    return true;
  }
}
