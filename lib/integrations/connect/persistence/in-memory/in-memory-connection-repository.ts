import { randomUUID } from "crypto";
import { nowIso } from "../../../utils/correlation";
import type { ConnectConnectionRow } from "../types";
import type { ConnectionRepository } from "../repositories/connection-repository";
import type { TokenPair } from "../../../types/common";

export class InMemoryConnectionRepository implements ConnectionRepository {
  private readonly rows = new Map<string, ConnectConnectionRow>();

  async create(input: Omit<ConnectConnectionRow, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<ConnectConnectionRow> {
    const now = nowIso();
    const row: ConnectConnectionRow = { id: input.id ?? randomUUID(), ...input, createdAt: now, updatedAt: now };
    this.rows.set(row.id, row);
    return { ...row };
  }

  async getById(id: string): Promise<ConnectConnectionRow | null> {
    const row = this.rows.get(id);
    return row ? { ...row } : null;
  }

  async findByEmployerAndProvider(employerAccountId: string, provider: ConnectConnectionRow["provider"]): Promise<ConnectConnectionRow | null> {
    const row = Array.from(this.rows.values()).find(
      (r) => r.employerAccountId === employerAccountId && r.provider === provider
    );
    return row ? { ...row } : null;
  }

  async updateStatus(id: string, status: string, metadata?: Record<string, unknown>): Promise<ConnectConnectionRow | null> {
    const row = this.rows.get(id);
    if (!row) return null;
    const updated = { ...row, status, metadata: metadata ?? row.metadata, updatedAt: nowIso() };
    this.rows.set(id, updated);
    return { ...updated };
  }

  async listByEmployer(employerAccountId: string): Promise<ConnectConnectionRow[]> {
    return Array.from(this.rows.values())
      .filter((r) => r.employerAccountId === employerAccountId)
      .map((r) => ({ ...r }));
  }

  async saveTokens(id: string, tokens: TokenPair, tokenStatus = "valid"): Promise<ConnectConnectionRow | null> {
    const row = this.rows.get(id);
    if (!row) return null;
    const updated: ConnectConnectionRow = {
      ...row,
      accessTokenEncrypted: tokens.accessToken,
      refreshTokenEncrypted: tokens.refreshToken ?? "",
      tokenExpiresAt: tokens.expiresAt,
      tokenStatus,
      oauthScopes: tokens.scopes,
      status: "connected",
      updatedAt: nowIso(),
    };
    this.rows.set(id, updated);
    return { ...updated };
  }

  async updateTokens(id: string, tokens: TokenPair): Promise<ConnectConnectionRow | null> {
    return this.saveTokens(id, tokens, "valid");
  }

  async clearTokens(id: string): Promise<ConnectConnectionRow | null> {
    const row = this.rows.get(id);
    if (!row) return null;
    const updated: ConnectConnectionRow = {
      ...row,
      accessTokenEncrypted: undefined,
      refreshTokenEncrypted: undefined,
      tokenExpiresAt: undefined,
      tokenStatus: "revoked",
      status: "disconnected",
      updatedAt: nowIso(),
    };
    this.rows.set(id, updated);
    return { ...updated };
  }

  async updateHealth(id: string, input: { lastHealthCheckAt: string; lastHealthStatus: string; metadata?: Record<string, unknown> }): Promise<ConnectConnectionRow | null> {
    const row = this.rows.get(id);
    if (!row) return null;
    const updated = {
      ...row,
      lastHealthCheckAt: input.lastHealthCheckAt,
      lastHealthStatus: input.lastHealthStatus,
      metadata: input.metadata ? { ...row.metadata, ...input.metadata } : row.metadata,
      updatedAt: nowIso(),
    };
    this.rows.set(id, updated);
    return { ...updated };
  }

  async updateLastSync(id: string, lastSyncAt: string): Promise<ConnectConnectionRow | null> {
    const row = this.rows.get(id);
    if (!row) return null;
    const updated = { ...row, lastSyncAt, updatedAt: nowIso() };
    this.rows.set(id, updated);
    return { ...updated };
  }

  async updateProviderAccount(id: string, providerAccountId: string, providerAccountName?: string): Promise<ConnectConnectionRow | null> {
    const row = this.rows.get(id);
    if (!row) return null;
    const updated = { ...row, providerAccountId, providerAccountName, updatedAt: nowIso() };
    this.rows.set(id, updated);
    return { ...updated };
  }

  clear(): void {
    this.rows.clear();
  }
}
