import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import type { ConnectConnectionRow } from "../types";
import type { ConnectionRepository } from "../repositories/connection-repository";

function mapRow(row: Record<string, unknown>): ConnectConnectionRow {
  return {
    id: String(row.id),
    employerAccountId: String(row.employer_account_id),
    provider: row.provider as ConnectConnectionRow["provider"],
    providerAccountId: row.provider_account_id ? String(row.provider_account_id) : undefined,
    providerAccountName: row.provider_account_name ? String(row.provider_account_name) : undefined,
    status: String(row.status),
    oauthScopes: (row.oauth_scopes as string[]) ?? [],
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class SupabaseConnectionRepository implements ConnectionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async create(input: Omit<ConnectConnectionRow, "id" | "createdAt" | "updatedAt">): Promise<ConnectConnectionRow> {
    const { data, error } = await this.client
      .from("connect_connections")
      .insert({
        id: randomUUID(),
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

  async findByEmployerAndProvider(
    employerAccountId: string,
    provider: ConnectConnectionRow["provider"]
  ): Promise<ConnectConnectionRow | null> {
    const { data, error } = await this.client
      .from("connect_connections")
      .select("*")
      .eq("employer_account_id", employerAccountId)
      .eq("provider", provider)
      .maybeSingle();
    if (error) throw new Error(`Connection lookup failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async updateStatus(
    id: string,
    status: string,
    metadata?: Record<string, unknown>
  ): Promise<ConnectConnectionRow | null> {
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
    const { data, error } = await this.client
      .from("connect_connections")
      .select("*")
      .eq("employer_account_id", employerAccountId);
    if (error) throw new Error(`Connection list failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }
}
