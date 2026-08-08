import { randomUUID } from "crypto";
import type { ConnectAuditEntry, ConnectEventRecord, ConnectEventFilter, ConnectTimelineEntry } from "../types";
import { nowIso } from "../../utils/correlation";

/** In-memory event history for WorkVouch Connect (no persistence). */
export class EventHistoryStore {
  private readonly events = new Map<string, ConnectEventRecord>();
  private readonly byCorrelation = new Map<string, Set<string>>();

  create(input: Omit<ConnectEventRecord, "id" | "replayCount" | "simulationOnly" | "timeline" | "auditTrail" | "logs" | "createdAt" | "updatedAt"> & { id?: string }): ConnectEventRecord {
    const now = nowIso();
    const record: ConnectEventRecord = {
      id: input.id ?? randomUUID(),
      correlationId: input.correlationId,
      provider: input.provider,
      providerEvent: input.providerEvent,
      universalEvent: input.universalEvent,
      employerAccountId: input.employerAccountId,
      connectionId: input.connectionId,
      rawPayload: input.rawPayload,
      providerPayload: input.providerPayload,
      universalModel: input.universalModel,
      validation: input.validation,
      translation: input.translation,
      busEvent: input.busEvent,
      replayCount: 0,
      simulationOnly: input.simulationOnly ?? false,
      timeline: [],
      auditTrail: [],
      logs: [],
      metadata: input.metadata,
      createdAt: now,
      updatedAt: now,
    };
    this.events.set(record.id, record);
    const bucket = this.byCorrelation.get(record.correlationId) ?? new Set<string>();
    bucket.add(record.id);
    this.byCorrelation.set(record.correlationId, bucket);
    return record;
  }

  get(eventId: string): ConnectEventRecord | undefined {
    const record = this.events.get(eventId);
    return record ? { ...record, timeline: [...record.timeline], auditTrail: [...record.auditTrail], logs: [...record.logs] } : undefined;
  }

  update(eventId: string, patch: Partial<ConnectEventRecord>): ConnectEventRecord | undefined {
    const existing = this.events.get(eventId);
    if (!existing) return undefined;
    const updated: ConnectEventRecord = {
      ...existing,
      ...patch,
      timeline: patch.timeline ?? existing.timeline,
      auditTrail: patch.auditTrail ?? existing.auditTrail,
      logs: patch.logs ?? existing.logs,
      updatedAt: nowIso(),
    };
    this.events.set(eventId, updated);
    return this.get(eventId);
  }

  list(filter: ConnectEventFilter = {}): ConnectEventRecord[] {
    let results = Array.from(this.events.values());
    if (filter.provider) results = results.filter((e) => e.provider === filter.provider);
    if (filter.correlationId) results = results.filter((e) => e.correlationId === filter.correlationId);
    if (filter.universalEvent) results = results.filter((e) => e.universalEvent === filter.universalEvent);
    if (filter.employerAccountId) results = results.filter((e) => e.employerAccountId === filter.employerAccountId);
    if (filter.connectionId) results = results.filter((e) => e.connectionId === filter.connectionId);
    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (filter.limit) results = results.slice(0, filter.limit);
    return results.map((record) => this.get(record.id)!);
  }

  listByCorrelation(correlationId: string): ConnectEventRecord[] {
    const ids = this.byCorrelation.get(correlationId);
    if (!ids) return [];
    return Array.from(ids).map((id) => this.get(id)!).filter(Boolean);
  }

  appendTimeline(eventId: string, entry: ConnectTimelineEntry): void {
    const record = this.events.get(eventId);
    if (!record) return;
    record.timeline.push(entry);
    record.updatedAt = nowIso();
  }

  appendAudit(eventId: string, entry: ConnectAuditEntry): void {
    const record = this.events.get(eventId);
    if (!record) return;
    record.auditTrail.push(entry);
    record.updatedAt = nowIso();
  }

  incrementReplay(eventId: string): void {
    const record = this.events.get(eventId);
    if (!record) return;
    record.replayCount += 1;
    record.updatedAt = nowIso();
  }

  clear(): void {
    this.events.clear();
    this.byCorrelation.clear();
  }

  size(): number {
    return this.events.size;
  }
}
