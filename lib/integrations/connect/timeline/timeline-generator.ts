import type { ConnectLifecycleStage, ConnectTimelineEntry } from "../types";
import type { EventHistoryStore } from "../history/event-history-store";
import { nowIso } from "../../utils/correlation";

const STAGE_ORDER: ConnectLifecycleStage[] = [
  "received",
  "validated",
  "mapped",
  "published",
  "consumed",
  "succeeded",
  "completed",
];

export class TimelineGenerator {
  constructor(private readonly history: EventHistoryStore) {}

  addStage(
    eventId: string,
    stage: ConnectLifecycleStage,
    input?: { durationMs?: number; message?: string; metadata?: Record<string, unknown> }
  ): ConnectTimelineEntry {
    const entry: ConnectTimelineEntry = {
      stage,
      timestamp: nowIso(),
      durationMs: input?.durationMs,
      message: input?.message,
      metadata: input?.metadata,
    };
    this.history.appendTimeline(eventId, entry);
    return entry;
  }

  buildFromAudit(eventId: string): ConnectTimelineEntry[] {
    const record = this.history.get(eventId);
    if (!record) return [];

    const auditToStage: Record<string, ConnectLifecycleStage> = {
      received: "received",
      validated: "validated",
      mapped: "mapped",
      published: "published",
      consumed: "consumed",
      succeeded: "completed",
      failed: "failed",
      retried: "retried",
    };

    return record.auditTrail.map((entry) => ({
      stage: auditToStage[entry.action] ?? "received",
      timestamp: entry.timestamp,
      durationMs: entry.durationMs,
      message: entry.message,
      metadata: entry.metadata,
    }));
  }

  getTimeline(eventId: string): ConnectTimelineEntry[] {
    const record = this.history.get(eventId);
    if (!record) return [];
    if (record.timeline.length > 0) return record.timeline;
    return this.buildFromAudit(eventId);
  }

  getTimelineWithDurations(eventId: string): ConnectTimelineEntry[] {
    const timeline = this.getTimeline(eventId);
    return timeline.map((entry, index) => {
      if (index === 0) return entry;
      const prev = timeline[index - 1];
      const durationMs =
        entry.durationMs ??
        Math.max(0, new Date(entry.timestamp).getTime() - new Date(prev.timestamp).getTime());
      return { ...entry, durationMs };
    });
  }

  summarize(eventId: string): { totalDurationMs: number; stages: ConnectLifecycleStage[]; completed: boolean } {
    const timeline = this.getTimelineWithDurations(eventId);
    const totalDurationMs = timeline.reduce((sum, entry) => sum + (entry.durationMs ?? 0), 0);
    return {
      totalDurationMs,
      stages: timeline.map((entry) => entry.stage),
      completed: timeline.some((entry) => entry.stage === "completed" || entry.stage === "succeeded"),
    };
  }

  static expectedStages(): ConnectLifecycleStage[] {
    return [...STAGE_ORDER];
  }
}
