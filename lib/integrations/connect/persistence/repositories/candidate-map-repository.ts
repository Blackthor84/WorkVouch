import type { ConnectCandidateMapRow } from "../types";

export interface CandidateMapRepository {
  upsert(input: Omit<ConnectCandidateMapRow, "id" | "createdAt" | "updatedAt">): Promise<ConnectCandidateMapRow>;
  getByExternalId(connectionId: string, externalCandidateId: string): Promise<ConnectCandidateMapRow | null>;
  listByConnection(connectionId: string): Promise<ConnectCandidateMapRow[]>;
}
