import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ConnectProviderAccountRow } from "../types";
import type { ProviderAccountRepository } from "../repositories/provider-account-repository";

function mapRow(row: Record<string, unknown>): ConnectProviderAccountRow {
  return {
    id: String(row.id),
    connectionId: String(row.connection_id),
    provider: row.provider as ConnectProviderAccountRow["provider"],
    externalAccountId: String(row.external_account_id),
    accountName: row.account_name ? String(row.account_name) : undefined,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export class SupabaseProviderAccountRepository implements ProviderAccountRepository {
  constructor(private readonly client: SupabaseClient) {}

  async upsert(input: Omit<ConnectProviderAccountRow, "id" | "createdAt" | "updatedAt">): Promise<ConnectProviderAccountRow> {
    const { data, error } = await this.client
      .from("connect_provider_accounts")
      .upsert(
        {
          id: randomUUID(),
          connection_id: input.connectionId,
          provider: input.provider,
          external_account_id: input.externalAccountId,
          account_name: input.accountName ?? null,
          metadata: input.metadata,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "connection_id,external_account_id" }
      )
      .select("*")
      .single();
    if (error) throw new Error(`Provider account upsert failed: ${error.message}`);
    return mapRow(data as Record<string, unknown>);
  }

  async getByExternalId(connectionId: string, externalAccountId: string): Promise<ConnectProviderAccountRow | null> {
    const { data, error } = await this.client
      .from("connect_provider_accounts")
      .select("*")
      .eq("connection_id", connectionId)
      .eq("external_account_id", externalAccountId)
      .maybeSingle();
    if (error) throw new Error(`Provider account get failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  async listByConnection(connectionId: string): Promise<ConnectProviderAccountRow[]> {
    const { data, error } = await this.client.from("connect_provider_accounts").select("*").eq("connection_id", connectionId);
    if (error) throw new Error(`Provider account list failed: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }
}
