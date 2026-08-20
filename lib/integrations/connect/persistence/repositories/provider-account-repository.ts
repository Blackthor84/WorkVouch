import type { ConnectProviderAccountRow } from "../types";

export interface ProviderAccountRepository {
  upsert(input: Omit<ConnectProviderAccountRow, "id" | "createdAt" | "updatedAt">): Promise<ConnectProviderAccountRow>;
  getByExternalId(connectionId: string, externalAccountId: string): Promise<ConnectProviderAccountRow | null>;
  listByConnection(connectionId: string): Promise<ConnectProviderAccountRow[]>;
}
