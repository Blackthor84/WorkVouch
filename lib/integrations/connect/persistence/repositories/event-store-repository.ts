import type {
  AppendConnectEventInput,
  ConnectStoredEvent,
  EventStreamFilter,
  TimelineFilter,
} from "../types";

export interface EventStoreRepository {
  append(input: AppendConnectEventInput): Promise<ConnectStoredEvent>;
  getById(eventId: string): Promise<ConnectStoredEvent | null>;
  loadStream(filter: EventStreamFilter): Promise<ConnectStoredEvent[]>;
  loadTimeline(filter: TimelineFilter): Promise<ConnectStoredEvent[]>;
  getLatestSequence(aggregateType: string, aggregateId: string): Promise<number>;
  findByIdempotencyKey(key: string): Promise<ConnectStoredEvent | null>;
}
