import type { OAuthStateStore, StoredOAuthState } from "../../providers/greenhouse/types";
import type { OAuthStateRepository } from "../persistence/repositories/oauth-state-repository";
import type { AtsProviderId } from "../../types/common";

export interface ConnectOAuthStateAdapterOptions {
  oauthStates: OAuthStateRepository;
  provider: AtsProviderId;
}

/** Maps Connect OAuth state persistence to the Greenhouse OAuthStateStore interface. */
export class ConnectOAuthStateAdapter implements OAuthStateStore {
  constructor(private readonly options: ConnectOAuthStateAdapterOptions) {}

  async saveState(state: StoredOAuthState): Promise<void> {
    if (!state.connectionId) return;
    await this.options.oauthStates.save({
      state: state.state,
      connectionId: state.connectionId,
      employerAccountId: state.employerAccountId,
      provider: this.options.provider,
      codeVerifier: state.codeVerifier,
      redirectUri: state.redirectUri,
      expiresAt: state.expiresAt,
      createdAt: state.createdAt,
    });
  }

  async consumeState(state: string): Promise<StoredOAuthState | null> {
    const record = await this.options.oauthStates.consume(state);
    if (!record) return null;
    return {
      state: record.state,
      employerAccountId: record.employerAccountId,
      codeVerifier: record.codeVerifier,
      redirectUri: record.redirectUri,
      connectionId: record.connectionId,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
    };
  }

  async purgeExpired(): Promise<number> {
    return this.options.oauthStates.purgeExpired();
  }
}
