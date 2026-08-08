import type { ConnectEventStore } from "../event-store/connect-event-store";
import type { ProjectionRepository } from "../persistence/repositories/projection-repository";
import type { ConnectAggregateType, ConnectStoredEvent } from "../persistence/types";

export interface ProjectionResult {
  aggregateType: ConnectAggregateType;
  aggregateId: string;
  projectionName: string;
  sequenceNumber: number;
  state: Record<string, unknown>;
}

type ProjectionHandler = (
  state: Record<string, unknown>,
  event: ConnectStoredEvent
) => Record<string, unknown>;

const CANDIDATE_PROJECTION = "candidate_current_state";
const JOB_PROJECTION = "job_current_state";
const CONNECTION_PROJECTION = "connection_current_state";

/** Derives current state from immutable event history — never writes to event store. */
export class ProjectionEngine {
  constructor(
    private readonly eventStore: ConnectEventStore,
    private readonly projections: ProjectionRepository
  ) {}

  async projectCandidate(aggregateId: string): Promise<ProjectionResult> {
    return this.projectStream("candidate", aggregateId, CANDIDATE_PROJECTION, applyCandidateEvent);
  }

  async projectJob(aggregateId: string): Promise<ProjectionResult> {
    return this.projectStream("job", aggregateId, JOB_PROJECTION, applyJobEvent);
  }

  async projectConnection(aggregateId: string): Promise<ProjectionResult> {
    return this.projectStream("connection", aggregateId, CONNECTION_PROJECTION, applyConnectionEvent);
  }

  async projectState(
    aggregateType: ConnectAggregateType,
    aggregateId: string,
    projectionName: string
  ): Promise<ProjectionResult | null> {
    switch (aggregateType) {
      case "candidate":
        return this.projectCandidate(aggregateId);
      case "job":
        return this.projectJob(aggregateId);
      case "connection":
        return this.projectConnection(aggregateId);
      default:
        return this.projectStream(aggregateType, aggregateId, projectionName, applyGenericEvent);
    }
  }

  async rebuildAll(aggregateType: ConnectAggregateType, aggregateId: string): Promise<ProjectionResult[]> {
    const results: ProjectionResult[] = [];
    if (aggregateType === "candidate" || aggregateType === "application") {
      results.push(await this.projectCandidate(aggregateId));
    }
    if (aggregateType === "job") {
      results.push(await this.projectJob(aggregateId));
    }
    if (aggregateType === "connection") {
      results.push(await this.projectConnection(aggregateId));
    }
    return results;
  }

  private async projectStream(
    aggregateType: ConnectAggregateType,
    aggregateId: string,
    projectionName: string,
    handler: ProjectionHandler
  ): Promise<ProjectionResult> {
    const events = await this.eventStore.loadStream({ aggregateType, aggregateId });
    let state: Record<string, unknown> = {
      aggregateType,
      aggregateId,
      eventsApplied: 0,
    };

    for (const event of events) {
      state = handler(state, event);
      state.eventsApplied = (state.eventsApplied as number) + 1;
      state.lastEventType = event.eventType;
      state.lastOccurredAt = event.occurredAt;
    }

    const sequenceNumber = events.at(-1)?.sequenceNumber ?? 0;
    await this.projections.save({
      aggregateType,
      aggregateId,
      projectionName,
      sequenceNumber,
      state,
    });

    return { aggregateType, aggregateId, projectionName, sequenceNumber, state };
  }
}

function applyCandidateEvent(state: Record<string, unknown>, event: ConnectStoredEvent): Record<string, unknown> {
  const payload = event.payload;
  const model = (payload.universalModel ?? payload.entity ?? payload) as Record<string, unknown>;
  const entity = (model.entity ?? model) as Record<string, unknown>;
  const candidate = (entity.candidate ?? entity) as Record<string, unknown>;
  return {
    ...state,
    externalId: candidate.externalId ?? state.externalId,
    email: candidate.email ?? state.email,
    fullName: candidate.fullName ?? state.fullName,
    applicationStatus: candidate.applicationStatus ?? state.applicationStatus,
    verificationStatus: candidate.verificationStatus ?? state.verificationStatus ?? "not_invited",
    trustStatus: candidate.trustStatus ?? state.trustStatus ?? "not_linked",
    stage: event.eventType,
  };
}

function applyJobEvent(state: Record<string, unknown>, event: ConnectStoredEvent): Record<string, unknown> {
  const payload = event.payload;
  const model = (payload.universalModel ?? payload.entity ?? payload) as Record<string, unknown>;
  const entity = (model.entity ?? model) as Record<string, unknown>;
  const job = (entity.job ?? entity) as Record<string, unknown>;
  return {
    ...state,
    externalId: job.externalId ?? state.externalId,
    title: job.title ?? state.title,
    status: job.status ?? state.status,
    stage: event.eventType,
  };
}

function applyConnectionEvent(state: Record<string, unknown>, event: ConnectStoredEvent): Record<string, unknown> {
  return {
    ...state,
    status: event.payload.status ?? state.status ?? "unknown",
    provider: event.provider,
    stage: event.eventType,
  };
}

function applyGenericEvent(state: Record<string, unknown>, event: ConnectStoredEvent): Record<string, unknown> {
  return {
    ...state,
    lastEventType: event.eventType,
    lastPayload: event.payload,
  };
}

export { CANDIDATE_PROJECTION, JOB_PROJECTION, CONNECTION_PROJECTION };
