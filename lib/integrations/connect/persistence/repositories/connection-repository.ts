import type { AtsProviderId } from "../../../types/common";
import type { ConnectConnectionRow } from "../types";

export interface ConnectionRepository {
  create(input: Omit<ConnectConnectionRow, "id" | "createdAt" | "updatedAt">): Promise<ConnectConnectionRow>;
  getById(id: string): Promise<ConnectConnectionRow | null>;
  findByEmployerAndProvider(employerAccountId: string, provider: AtsProviderId): Promise<ConnectConnectionRow | null>;
  updateStatus(id: string, status: string, metadata?: Record<string, unknown>): Promise<ConnectConnectionRow | null>;
  listByEmployer(employerAccountId: string): Promise<ConnectConnectionRow[]>;
}
