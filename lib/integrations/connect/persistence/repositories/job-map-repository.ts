import type { ConnectJobMapRow } from "../types";

export interface JobMapRepository {
  upsert(input: Omit<ConnectJobMapRow, "id" | "createdAt" | "updatedAt">): Promise<ConnectJobMapRow>;
  getByExternalId(connectionId: string, externalJobId: string): Promise<ConnectJobMapRow | null>;
  listByConnection(connectionId: string): Promise<ConnectJobMapRow[]>;
}
