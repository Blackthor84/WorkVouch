import type { AtsProviderId } from "../../../types/common";
import type { TokenPair } from "../../../types/common";
import type { ConnectConnectionRow } from "../types";

export interface ConnectionRepository {
  create(input: Omit<ConnectConnectionRow, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<ConnectConnectionRow>;
  getById(id: string): Promise<ConnectConnectionRow | null>;
  findByEmployerAndProvider(employerAccountId: string, provider: AtsProviderId): Promise<ConnectConnectionRow | null>;
  updateStatus(id: string, status: string, metadata?: Record<string, unknown>): Promise<ConnectConnectionRow | null>;
  listByEmployer(employerAccountId: string): Promise<ConnectConnectionRow[]>;
  saveTokens(id: string, tokens: TokenPair, tokenStatus?: string): Promise<ConnectConnectionRow | null>;
  updateTokens(id: string, tokens: TokenPair): Promise<ConnectConnectionRow | null>;
  clearTokens(id: string): Promise<ConnectConnectionRow | null>;
  updateHealth(id: string, input: { lastHealthCheckAt: string; lastHealthStatus: string; metadata?: Record<string, unknown> }): Promise<ConnectConnectionRow | null>;
  updateLastSync(id: string, lastSyncAt: string): Promise<ConnectConnectionRow | null>;
  updateProviderAccount(id: string, providerAccountId: string, providerAccountName?: string): Promise<ConnectConnectionRow | null>;
}
