import type { CandidateFunnelTimeline, AggregationLevel, HiringMetricsBundle, MetricsPeriod, TrendComparison } from "./types";
import { HiringMetricsCalculator } from "./hiring-metrics-calculator";
import type { ConnectStoredEvent } from "../persistence/types";
import { emptyMetricsBundle } from "./types";

export interface AggregationGroup {
  level: AggregationLevel;
  key: string;
  events: ConnectStoredEvent[];
  timelines: CandidateFunnelTimeline[];
}

/** Rolls up candidate-level metrics to job, department, employer, and provider dimensions. */
export class HiringMetricsAggregator {
  private readonly calculator = new HiringMetricsCalculator();

  groupEvents(events: ConnectStoredEvent[], level: AggregationLevel): AggregationGroup[] {
    const timelines = this.calculator.buildCandidateTimelines(events);
    const groups = new Map<string, ConnectStoredEvent[]>();

    for (const event of events) {
      const key = this.resolveGroupKey(event, timelines, level);
      const list = groups.get(key) ?? [];
      list.push(event);
      groups.set(key, list);
    }

    return Array.from(groups.entries()).map(([key, groupEvents]) => ({
      level,
      key,
      events: groupEvents,
      timelines: this.calculator.buildCandidateTimelines(groupEvents),
    }));
  }

  aggregateByLevel(
    events: ConnectStoredEvent[],
    level: AggregationLevel
  ): Map<string, HiringMetricsBundle> {
    const groups = this.groupEvents(events, level);
    const result = new Map<string, HiringMetricsBundle>();

    for (const group of groups) {
      result.set(group.key, this.calculator.calculate(group.events));
    }

    return result;
  }

  aggregateAllDimensions(events: ConnectStoredEvent[]): Record<AggregationLevel, Map<string, HiringMetricsBundle>> {
    const levels: AggregationLevel[] = ["employer", "connection", "provider", "job", "department", "candidate"];
    const result = {} as Record<AggregationLevel, Map<string, HiringMetricsBundle>>;

    for (const level of levels) {
      result[level] = this.aggregateByLevel(events, level);
    }

    return result;
  }

  compareTrends(current: HiringMetricsBundle, previous: HiringMetricsBundle, period: MetricsPeriod): TrendComparison {
    const delta: TrendComparison["delta"] = {};
    for (const key of Object.keys(current.core) as Array<keyof HiringMetricsBundle["core"]>) {
      const cur = current.core[key];
      const prev = previous.core[key];
      if (typeof cur === "number" && typeof prev === "number") {
        delta[key] = cur - prev;
      }
    }

    return { current, previous, period, delta };
  }

  rollupDaily(events: ConnectStoredEvent[], dayKey: string): HiringMetricsBundle {
    const dayStart = `${dayKey}T00:00:00.000Z`;
    const dayEnd = `${dayKey}T23:59:59.999Z`;
    const filtered = events.filter((e) => e.occurredAt >= dayStart && e.occurredAt <= dayEnd);
    return filtered.length > 0 ? this.calculator.calculate(filtered) : emptyMetricsBundle();
  }

  private resolveGroupKey(
    event: ConnectStoredEvent,
    timelines: CandidateFunnelTimeline[],
    level: AggregationLevel
  ): string {
    switch (level) {
      case "employer":
        return event.companyId;
      case "connection":
        return event.connectionId ?? "unknown";
      case "provider":
        return event.provider;
      case "job": {
        const tl = timelines.find((t) => t.candidateId === event.aggregateId);
        return tl?.jobId ?? this.extractJobFromEvent(event) ?? "unknown";
      }
      case "department": {
        const tl = timelines.find((t) => t.candidateId === event.aggregateId);
        return tl?.department ?? "unknown";
      }
      case "candidate":
        return event.aggregateType === "candidate"
          ? event.aggregateId
          : this.calculator.buildCandidateTimelines([event])[0]?.candidateId ?? "unknown";
      default:
        return "unknown";
    }
  }

  private extractJobFromEvent(event: ConnectStoredEvent): string | undefined {
    const model = event.payload?.universalModel as Record<string, unknown> | undefined;
    const application = model?.application as { jobExternalId?: string } | undefined;
    return application?.jobExternalId;
  }
}
