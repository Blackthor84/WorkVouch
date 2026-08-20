import type { ConnectWebhookLogRow } from "../types";

export interface WebhookRepository {
  append(input: Omit<ConnectWebhookLogRow, "id" | "receivedAt"> & { id?: string; receivedAt?: string }): Promise<ConnectWebhookLogRow>;
  getByProviderEventId(provider: string, providerEventId: string): Promise<ConnectWebhookLogRow | null>;
  updateStatus(id: string, status: string, processedAt?: string, durationMs?: number): Promise<ConnectWebhookLogRow | null>;
  listByConnection(connectionId: string, limit?: number): Promise<ConnectWebhookLogRow[]>;
}
