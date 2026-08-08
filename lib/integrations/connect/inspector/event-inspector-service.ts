import type { EventDispatcher } from "../../events/EventDispatcher";
import type { LoggingService } from "../../logging/LoggingService";
import type { ConnectEventFilter, ConnectEventRecord, EventInspection } from "../types";
import type { EventHistoryStore } from "../history/event-history-store";
import type { TimelineGenerator } from "../timeline/timeline-generator";

export class EventInspectorService {
  constructor(
    private readonly history: EventHistoryStore,
    private readonly dispatcher: EventDispatcher,
    private readonly logger: LoggingService,
    private readonly timeline: TimelineGenerator
  ) {}

  getEvent(eventId: string): ConnectEventRecord | undefined {
    return this.history.get(eventId);
  }

  listEvents(filter?: ConnectEventFilter): ConnectEventRecord[] {
    return this.history.list(filter);
  }

  inspectEvent(eventId: string): EventInspection | undefined {
    const event = this.history.get(eventId);
    if (!event) return undefined;
    return this.buildInspection(event);
  }

  inspectPayload(eventId: string): unknown {
    return this.history.get(eventId)?.rawPayload;
  }

  inspectProviderPayload(eventId: string): unknown {
    return this.history.get(eventId)?.providerPayload ?? this.history.get(eventId)?.rawPayload;
  }

  inspectUniversalModel(eventId: string): unknown {
    const record = this.history.get(eventId);
    if (!record) return undefined;
    const envelope = record.busEvent?.payload as { entity?: unknown } | undefined;
    return record.universalModel ?? envelope?.entity;
  }

  inspectValidation(eventId: string) {
    return this.history.get(eventId)?.validation;
  }

  inspectTranslation(eventId: string) {
    return this.history.get(eventId)?.translation;
  }

  inspectMetadata(eventId: string): Record<string, unknown> {
    const record = this.history.get(eventId);
    return {
      ...(record?.metadata ?? {}),
      replayCount: record?.replayCount ?? 0,
      simulationOnly: record?.simulationOnly ?? false,
      busEventId: record?.busEvent?.id,
      busEventStatus: record?.busEvent?.status,
    };
  }

  inspectEventTimeline(eventId: string) {
    return this.timeline.getTimelineWithDurations(eventId);
  }

  inspectLogs(eventId: string, limit = 50) {
    const record = this.history.get(eventId);
    if (!record) return [];
    const correlationLogs = this.logger
      .getEntries(limit)
      .filter((entry) => entry.correlationId === record.correlationId);
    return [...record.logs, ...correlationLogs];
  }

  inspectBusEvent(eventId: string) {
    const record = this.history.get(eventId);
    if (!record?.busEvent) return this.dispatcher.getEvent(eventId);
    return record.busEvent;
  }

  private buildInspection(event: ConnectEventRecord): EventInspection {
    return {
      event,
      payload: event.rawPayload,
      providerPayload: event.providerPayload ?? event.rawPayload,
      universalModel: this.inspectUniversalModel(event.id),
      validation: event.validation,
      translation: event.translation,
      timeline: this.timeline.getTimelineWithDurations(event.id),
      metadata: this.inspectMetadata(event.id),
      logs: this.inspectLogs(event.id),
    };
  }
}
