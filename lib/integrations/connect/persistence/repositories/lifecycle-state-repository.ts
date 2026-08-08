import type { LifecycleStateRecord } from "../../orchestration/types";

export interface LifecycleStateRepository {
  upsert(input: Omit<LifecycleStateRecord, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<LifecycleStateRecord>;
  getByCandidate(connectionId: string, externalCandidateId: string): Promise<LifecycleStateRecord | null>;
  listByConnection(connectionId: string): Promise<LifecycleStateRecord[]>;
}
