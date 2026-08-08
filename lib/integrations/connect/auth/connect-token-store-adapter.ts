import type { TokenPair } from "../../types/common";
import type { StoredGreenhouseConnection, TokenStore } from "../../providers/greenhouse/types";
import type { ConnectionManager } from "../connection/connection-manager";

/** Adapts ConnectionManager to the Greenhouse TokenStore interface. */
export class ConnectTokenStoreAdapter implements TokenStore {
  constructor(private readonly connections: ConnectionManager) {}

  async saveConnection(connection: StoredGreenhouseConnection): Promise<void> {
    await this.connections.completeConnection({
      connectionId: connection.connectionId,
      tokens: {
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken,
        expiresAt: connection.expiresAt,
        scopes: connection.scopes,
      },
      providerAccountId: connection.providerAccountId,
      providerAccountName: connection.providerAccountName,
    });
  }

  async getConnection(connectionId: string): Promise<StoredGreenhouseConnection | null> {
    const summary = await this.connections.getConnection(connectionId);
    const tokens = await this.connections.getTokens(connectionId);
    if (!summary || !tokens) return null;

    return {
      connectionId: summary.connectionId,
      employerAccountId: summary.employerAccountId,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      scopes: tokens.scopes,
      providerAccountId: summary.providerAccountId,
      providerAccountName: summary.providerAccountName,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
    };
  }

  async deleteConnection(connectionId: string): Promise<void> {
    await this.connections.disconnect(connectionId);
  }

  async updateTokens(connectionId: string, tokens: TokenPair): Promise<void> {
    await this.connections.refreshTokens(connectionId, tokens);
  }
}
