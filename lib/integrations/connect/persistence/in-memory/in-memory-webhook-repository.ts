import { randomUUID } from "crypto";
import { nowIso } from "../../../utils/correlation";
import type { ConnectWebhookLogRow } from "../types";
import type { WebhookRepository } from "../repositories/webhook-repository";

export class InMemoryWebhookRepository implements WebhookRepository {
  private readonly rows = new Map<string, ConnectWebhookLogRow>();
  private readonly byProviderEvent = new Map<string, string>();

  async append(input: Omit<ConnectWebhookLogRow, "id" | "receivedAt"> & { id?: string; receivedAt?: string }): Promise<ConnectWebhookLogRow> {
    const dedupKey = `${input.provider}:${input.providerEventId}`;
    const existingId = this.byProviderEvent.get(dedupKey);
    if (existingId) {
      const existing = this.rows.get(existingId);
      if (existing) return { ...existing };
    }

    const row: ConnectWebhookLogRow = {
      id: input.id ?? randomUUID(),
      connectionId: input.connectionId,
      provider: input.provider,
      providerEventId: input.providerEventId,
      providerEventType: input.providerEventType,
      normalizedEventType: input.normalizedEventType,
      status: input.status,
      payloadHash: input.payloadHash,
      receivedAt: input.receivedAt ?? nowIso(),
      processedAt: input.processedAt,
      durationMs: input.durationMs,
      metadata: input.metadata ?? {},
    };
    this.rows.set(row.id, row);
    this.byProviderEvent.set(dedupKey, row.id);
    return { ...row };
  }

  async getByProviderEventId(provider: string, providerEventId: string): Promise<ConnectWebhookLogRow | null> {
    const id = this.byProviderEvent.get(`${provider}:${providerEventId}`);
    return id ? this.rows.get(id) ?? null : null;
  }

  async updateStatus(id: string, status: string, processedAt?: string, durationMs?: number): Promise<ConnectWebhookLogRow | null> {
    const row = this.rows.get(id);
    if (!row) return null;
    const updated = { ...row, status, processedAt, durationMs };
    this.rows.set(id, updated);
    return { ...updated };
  }

  async listByConnection(connectionId: string, limit = 100): Promise<ConnectWebhookLogRow[]> {
    return Array.from(this.rows.values())
      .filter((r) => r.connectionId === connectionId)
      .slice(-limit)
      .map((r) => ({ ...r }));
  }

  clear(): void {
    this.rows.clear();
    this.byProviderEvent.clear();
  }
}
