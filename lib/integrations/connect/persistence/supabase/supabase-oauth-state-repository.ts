import type { SupabaseClient } from "@supabase/supabase-js";
import type { AtsProviderId } from "../../../types/common";
import type { ConnectOAuthStateRecord } from "../../auth/types";
import type { OAuthStateRepository } from "../repositories/oauth-state-repository";
import { ConnectSecureTokenStorage } from "../../auth/secure-token-storage";

function mapRow(row: Record<string, unknown>, storage: ConnectSecureTokenStorage): ConnectOAuthStateRecord {
  return {
    state: String(row.state),
    connectionId: String(row.connection_id),
    employerAccountId: String(row.employer_account_id),
    provider: row.provider as AtsProviderId,
    codeVerifier: storage.decrypt(String(row.code_verifier_encrypted)),
    redirectUri: String(row.redirect_uri),
    expiresAt: String(row.expires_at),
    createdAt: String(row.created_at),
  };
}

export class SupabaseOAuthStateRepository implements OAuthStateRepository {
  private readonly storage = new ConnectSecureTokenStorage();

  constructor(private readonly client: SupabaseClient) {}

  async save(record: ConnectOAuthStateRecord): Promise<void> {
    const { error } = await this.client.from("connect_oauth_state").insert({
      state: record.state,
      connection_id: record.connectionId,
      employer_account_id: record.employerAccountId,
      provider: record.provider,
      code_verifier_encrypted: this.storage.encrypt(record.codeVerifier),
      redirect_uri: record.redirectUri,
      expires_at: record.expiresAt,
      created_at: record.createdAt,
    });
    if (error) throw new Error(`OAuth state save failed: ${error.message}`);
  }

  async consume(state: string): Promise<ConnectOAuthStateRecord | null> {
    const { data, error } = await this.client.from("connect_oauth_state").select("*").eq("state", state).maybeSingle();
    if (error) throw new Error(`OAuth state get failed: ${error.message}`);
    if (!data) return null;

    await this.client.from("connect_oauth_state").delete().eq("state", state);
    const record = mapRow(data as Record<string, unknown>, this.storage);
    if (new Date(record.expiresAt).getTime() < Date.now()) return null;
    return record;
  }

  async purgeExpired(): Promise<number> {
    const { data, error } = await this.client
      .from("connect_oauth_state")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("state");
    if (error) throw new Error(`OAuth state purge failed: ${error.message}`);
    return data?.length ?? 0;
  }

  async findByConnectionId(connectionId: string): Promise<ConnectOAuthStateRecord | null> {
    const { data, error } = await this.client
      .from("connect_oauth_state")
      .select("*")
      .eq("connection_id", connectionId)
      .maybeSingle();
    if (error) throw new Error(`OAuth state lookup failed: ${error.message}`);
    return data ? mapRow(data as Record<string, unknown>, this.storage) : null;
  }
}
