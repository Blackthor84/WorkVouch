import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectConnectionRow } from "../types";
import type { ConnectionRepository } from "../repositories/connection-repository";
import type { TokenPair } from "../../../types/common";

function mapRow(row: Record<string, unknown>): ConnectConnectionRow {
  return {
    id: String(row.id),
    employerAccountId: String(row.employer_account_id),
    provider: row.provider as ConnectConnectionRow["provider"],
    providerAccountId: row.provider_account_id ? String(row.provider_account_id) : undefined,
    providerAccountName: row.provider_account_name ? String(row.provider_account_name) : undefined,
    status: String(row.status),
    oauthScopes: (row.oauth_scopes as string[]) ?? [],
    accessTokenEncrypted: row.access_token_encrypted ? String(row.access_token_encrypted) : undefined,
    refreshTokenEncrypted: row.refresh_token_encrypted ? String(row.refresh_token_encrypted) : undefined,
    tokenExpiresAt: row.token_expires_at ? String(row.token_expires_at) : undefined,
    tokenStatus: row.token_status ? String(row.token_status) : undefined,
    lastHealthCheckAt: row.last_health_check_at ? String(row.last_health_check_at) : undefined,
    lastHealthStatus: row.last_health_status ? String(row.last_health_status) : undefined,
    lastSyncAt: row.last_sync_at ? String(row.last_sync_at) : undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class SupabaseConnectionRepository implements ConnectionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(input: Omit<ConnectConnectionRow, "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<ConnectConnectionRow> {
    const { data, error } = await this.client
      .from("connect_connections")
      .insert({
        id: input.id ?? randomUUID(),
        employer_account_id: input.employerAccountId,
        provider: input.provider,
        provider_account_id: input.providerAccountId ?? null,
        provider_account_name: input.providerAccountName ?? null,
        status: input.status,
        oauth_scopes: input.oauthScopes,
        metadata: input.metadata,
      })
      .select("*")
      .single();
    if (error) throw new Error(`Connection create failed: ${error.message}`);
    return mapRow(data as Record<string, unknown>);
  }

  async getById(id: string): Promise<ConnectConnectionRow | null> {
    const { data, error } = await this.client.from("connect_connections").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`Connection get failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async findByEmployerAndProvider(employerAccountId: string, provider: ConnectConnectionRow["provider"]): Promise<ConnectConnectionRow | null> {
    const { data, error } = await this.client
      .from("connect_connections")
      .select("*")
      .eq("employer_account_id", employerAccountId)
      .eq("provider", provider)
      .maybeSingle();
    if (error) throw new Error(`Connection lookup failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async updateStatus(id: string, status: string, metadata?: Record<string, unknown>): Promise<ConnectConnectionRow | null> {
    const { data, error } = await this.client
      .from("connect_connections")
      .update({ status, metadata: metadata ?? {}, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Connection update failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async listByEmployer(employerAccountId: string): Promise<ConnectConnectionRow[]> {
    const { data, error } = await this.client.from("connect_connections").select("*").eq("employer_account_id", employerAccountId);
    if (error) throw new Error(`Connection list failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }

  async saveTokens(id: string, tokens: TokenPair, tokenStatus = "valid"): Promise<ConnectConnectionRow | null> {
    const { data, error } = await this.client
      .from("connect_connections")
      .update({
        access_token_encrypted: tokens.accessToken,
        refresh_token_encrypted: tokens.refreshToken ?? null,
        token_expires_at: tokens.expiresAt,
        token_status: tokenStatus,
        oauth_scopes: tokens.scopes,
        status: "connected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Connection save tokens failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async updateTokens(id: string, tokens: TokenPair): Promise<ConnectConnectionRow | null> {
    return this.saveTokens(id, tokens, "valid");
  }

  async clearTokens(id: string): Promise<ConnectConnectionRow | null> {
    const { data, error } = await this.client
      .from("connect_connections")
      .update({
        access_token_encrypted: null,
        refresh_token_encrypted: null,
        token_expires_at: null,
        token_status: "revoked",
        status: "disconnected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Connection clear tokens failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async updateHealth(id: string, input: { lastHealthCheckAt: string; lastHealthStatus: string; metadata?: Record<string, unknown> }): Promise<ConnectConnectionRow | null> {
    const { data, error } = await this.client
      .from("connect_connections")
      .update({
        last_health_check_at: input.lastHealthCheckAt,
        last_health_status: input.lastHealthStatus,
        metadata: input.metadata ?? {},
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Connection health update failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async updateLastSync(id: string, lastSyncAt: string): Promise<ConnectConnectionRow | null> {
    const { data, error } = await this.client
      .from("connect_connections")
      .update({ last_sync_at: lastSyncAt, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Connection sync update failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async updateProviderAccount(id: string, providerAccountId: string, providerAccountName?: string): Promise<ConnectConnectionRow | null> {
    const { data, error } = await this.client
      .from("connect_connections")
      .update({
        provider_account_id: providerAccountId,
        provider_account_name: providerAccountName ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(`Connection provider account update failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }
}
