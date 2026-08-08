import type { LoggingService } from "../../logging/LoggingService";
import type { CorrelationExploration } from "../types";
import type { EventHistoryStore } from "../history/event-history-store";
import type { EventInspectorService } from "../inspector/event-inspector-service";
import type { TimelineGenerator } from "../timeline/timeline-generator";
import type { ReplayService } from "../replay/replay-service";

export class CorrelationExplorerService {
  constructor(
    private readonly history: EventHistoryStore,
    private readonly inspector: EventInspectorService,
    private readonly timeline: TimelineGenerator,
    private readonly replay: ReplayService,
    private readonly logger: LoggingService
  ) {}

  explore(correlationId: string): CorrelationExploration {
    const events = this.history.listByCorrelation(correlationId);
    const timeline = events.flatMap((event) => this.timeline.getTimelineWithDurations(event.id));
    const auditTrail = events.flatMap((event) => event.auditTrail);
    const logs = this.logger.getEntries(200).filter((entry) => entry.correlationId === correlationId);
    const replayHistory = this.replay.getReplayHistory().filter((entry) => entry.correlationId.startsWith(correlationId));

    return {
      correlationId,
      provider: events[0]?.provider,
      events,
      timeline,
      auditTrail,
      logs,
      replayHistory,
    };
  }

  inspectByCorrelation(correlationId: string) {
    return this.explore(correlationId).events.map((event) => this.inspector.inspectEvent(event.id)!);
  }
}
