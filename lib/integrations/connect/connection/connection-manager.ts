import type { AtsProviderId } from "../../types/common";
import type { TokenPair } from "../../types/common";
import type { ConnectionRepository } from "../persistence/repositories/connection-repository";
import type { OAuthStateRepository } from "../persistence/repositories/oauth-state-repository";
import type { ProviderAccountRepository } from "../persistence/repositories/provider-account-repository";
import type { SyncCursorManager } from "../sync/sync-cursor-manager";
import type { ConnectSyncCursorRow, CursorValidationResult, SyncImportMode } from "../sync/types";
import { ConnectSecureTokenStorage } from "../auth/secure-token-storage";
import type { ConnectOAuthStateRecord, ConnectStoredTokens } from "../auth/types";
import type {
  CompleteConnectionInput,
  ConnectionSummary,
  ConnectionTestResult,
  CreateConnectionInput,
  ScopeValidationResult,
} from "./types";
import { IntegrationPlatformError } from "../../utils/errors";
import { nowIso } from "../../utils/correlation";

const DEFAULT_OAUTH_TTL_MS = 15 * 60 * 1000;

export interface ConnectionManagerDeps {
  connections: ConnectionRepository;
  oauthStates: OAuthStateRepository;
  providerAccounts?: ProviderAccountRepository;
  tokenStorage?: ConnectSecureTokenStorage;
  cursorManager?: SyncCursorManager;
}

export interface StartOAuthInput {
  employerAccountId: string;
  provider: AtsProviderId;
  redirectUri: string;
  requiredScopes: string[];
  codeVerifier: string;
  state: string;
}

export interface StartOAuthResult {
  connectionId: string;
  state: string;
}

export interface TestConnectionFn {
  (accessToken: string): Promise<{ success: boolean; message: string; providerAccountId?: string; providerAccountName?: string }>;
}

/** Provider-agnostic connection lifecycle manager. */
export class ConnectionManager {
  private readonly storage: ConnectSecureTokenStorage;

  constructor(private readonly deps: ConnectionManagerDeps) {
    this.storage = deps.tokenStorage ?? new ConnectSecureTokenStorage();
  }

  async createPendingConnection(input: CreateConnectionInput): Promise<ConnectionSummary> {
    const existing = await this.deps.connections.findByEmployerAndProvider(input.employerAccountId, input.provider);
    if (existing && existing.status === "connected") {
      throw new IntegrationPlatformError({
        code: "CONNECTION_ALREADY_EXISTS",
        message: `Active ${input.provider} connection already exists for employer.`,
        retryable: false,
        provider: input.provider,
      });
    }

    const row = existing
      ? (await this.deps.connections.updateStatus(existing.id, "pending", input.metadata))!
      : await this.deps.connections.create({
          employerAccountId: input.employerAccountId,
          provider: input.provider,
          status: input.status ?? "pending",
          oauthScopes: input.oauthScopes ?? [],
          metadata: input.metadata ?? {},
        });

    return this.toSummary(row);
  }

  async startOAuth(input: StartOAuthInput): Promise<StartOAuthResult> {
    const connection = await this.createPendingConnection({
      employerAccountId: input.employerAccountId,
      provider: input.provider,
      status: "pending",
      oauthScopes: input.requiredScopes,
    });

    const createdAt = nowIso();
    const record: ConnectOAuthStateRecord = {
      state: input.state,
      connectionId: connection.connectionId,
      employerAccountId: input.employerAccountId,
      provider: input.provider,
      codeVerifier: input.codeVerifier,
      redirectUri: input.redirectUri,
      createdAt,
      expiresAt: new Date(Date.now() + DEFAULT_OAUTH_TTL_MS).toISOString(),
    };

    await this.deps.oauthStates.save(record);
    return { connectionId: connection.connectionId, state: input.state };
  }

  async completeConnection(input: CompleteConnectionInput): Promise<ConnectionSummary> {
    const encryptedAccess = this.storage.encrypt(input.tokens.accessToken);
    const encryptedRefresh = this.storage.encrypt(input.tokens.refreshToken ?? "");

    const row = await this.deps.connections.saveTokens(input.connectionId, {
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
      expiresAt: input.tokens.expiresAt,
      scopes: input.tokens.scopes,
    });

    if (!row) {
      throw new IntegrationPlatformError({
        code: "CONNECTION_NOT_FOUND",
        message: `Connection ${input.connectionId} not found.`,
        retryable: false,
      });
    }

    if (input.providerAccountId) {
      await this.deps.connections.updateProviderAccount(
        input.connectionId,
        input.providerAccountId,
        input.providerAccountName
      );

      if (this.deps.providerAccounts) {
        await this.deps.providerAccounts.upsert({
          connectionId: input.connectionId,
          provider: row.provider,
          externalAccountId: input.providerAccountId,
          accountName: input.providerAccountName,
          metadata: {},
        });
      }
    }

    const updated = await this.deps.connections.getById(input.connectionId);
    return this.toSummary(updated!);
  }

  async getConnection(connectionId: string): Promise<ConnectionSummary | null> {
    const row = await this.deps.connections.getById(connectionId);
    return row ? this.toSummary(row) : null;
  }

  async getTokens(connectionId: string): Promise<ConnectStoredTokens | null> {
    const row = await this.deps.connections.getById(connectionId);
    if (!row?.accessTokenEncrypted) return null;

    return {
      accessToken: this.storage.decrypt(row.accessTokenEncrypted),
      refreshToken: row.refreshTokenEncrypted ? this.storage.decrypt(row.refreshTokenEncrypted) : "",
      expiresAt: row.tokenExpiresAt ?? "",
      scopes: row.oauthScopes,
      tokenStatus: (row.tokenStatus as ConnectStoredTokens["tokenStatus"]) ?? "unknown",
    };
  }

  async refreshTokens(connectionId: string, tokens: TokenPair): Promise<ConnectionSummary> {
    const row = await this.deps.connections.updateTokens(connectionId, {
      accessToken: this.storage.encrypt(tokens.accessToken),
      refreshToken: this.storage.encrypt(tokens.refreshToken ?? ""),
      expiresAt: tokens.expiresAt,
      scopes: tokens.scopes,
    });

    if (!row) {
      throw new IntegrationPlatformError({
        code: "CONNECTION_NOT_FOUND",
        message: `Connection ${connectionId} not found.`,
        retryable: false,
      });
    }

    return this.toSummary(row);
  }

  async disconnect(connectionId: string): Promise<ConnectionSummary> {
    const row = await this.deps.connections.clearTokens(connectionId);
    if (!row) {
      throw new IntegrationPlatformError({
        code: "CONNECTION_NOT_FOUND",
        message: `Connection ${connectionId} not found.`,
        retryable: false,
      });
    }
    return this.toSummary(row);
  }

  async markExpired(connectionId: string): Promise<ConnectionSummary> {
    const row = await this.deps.connections.updateStatus(connectionId, "expired", { tokenStatus: "expired" });
    if (!row) {
      throw new IntegrationPlatformError({
        code: "CONNECTION_NOT_FOUND",
        message: `Connection ${connectionId} not found.`,
        retryable: false,
      });
    }
    return this.toSummary(row);
  }

  async updateHealth(connectionId: string, status: string, metadata?: Record<string, unknown>): Promise<ConnectionSummary> {
    const row = await this.deps.connections.updateHealth(connectionId, {
      lastHealthCheckAt: nowIso(),
      lastHealthStatus: status,
      metadata,
    });
    if (!row) {
      throw new IntegrationPlatformError({
        code: "CONNECTION_NOT_FOUND",
        message: `Connection ${connectionId} not found.`,
        retryable: false,
      });
    }
    return this.toSummary(row);
  }

  async updateLastSync(connectionId: string): Promise<ConnectionSummary> {
    const row = await this.deps.connections.updateLastSync(connectionId, nowIso());
    if (!row) {
      throw new IntegrationPlatformError({
        code: "CONNECTION_NOT_FOUND",
        message: `Connection ${connectionId} not found.`,
        retryable: false,
      });
    }
    return this.toSummary(row);
  }

  async consumeOAuthState(state: string): Promise<ConnectOAuthStateRecord | null> {
    return this.deps.oauthStates.consume(state);
  }

  validateScopes(granted: string[], required: string[]): ScopeValidationResult {
    const missing = required.filter((scope) => !granted.includes(scope));
    return { valid: missing.length === 0, granted, required, missing };
  }

  isTokenExpired(expiresAt?: string): boolean {
    if (!expiresAt) return true;
    return new Date(expiresAt).getTime() <= Date.now() + 60_000;
  }

  async testConnection(connectionId: string, tester: TestConnectionFn): Promise<ConnectionTestResult> {
    const started = Date.now();
    const tokens = await this.getTokens(connectionId);
    if (!tokens) {
      return {
        success: false,
        latencyMs: Date.now() - started,
        message: "No tokens stored for connection",
        checkedAt: nowIso(),
      };
    }

    try {
      const result = await tester(tokens.accessToken);
      await this.updateHealth(connectionId, result.success ? "healthy" : "unhealthy", {
        latencyMs: Date.now() - started,
      });

      if (result.providerAccountId) {
        await this.deps.connections.updateProviderAccount(
          connectionId,
          result.providerAccountId,
          result.providerAccountName
        );
      }

      return {
        success: result.success,
        latencyMs: Date.now() - started,
        message: result.message,
        providerAccountId: result.providerAccountId,
        providerAccountName: result.providerAccountName,
        checkedAt: nowIso(),
      };
    } catch (error) {
      await this.updateHealth(connectionId, "unhealthy", {
        error: error instanceof Error ? error.message : "Test failed",
      });
      return {
        success: false,
        latencyMs: Date.now() - started,
        message: error instanceof Error ? error.message : "Connection test failed",
        checkedAt: nowIso(),
      };
    }
  }

  async getCursor(connectionId: string): Promise<ConnectSyncCursorRow | null> {
    if (!this.deps.cursorManager) return null;
    return this.deps.cursorManager.getCursor(connectionId);
  }

  async updateCursor(connectionId: string, input: Parameters<SyncCursorManager["updateCursor"]>[1]): Promise<ConnectSyncCursorRow | null> {
    if (!this.deps.cursorManager) return null;
    return this.deps.cursorManager.updateCursor(connectionId, input);
  }

  async resetCursor(connectionId: string): Promise<ConnectSyncCursorRow | null> {
    if (!this.deps.cursorManager) return null;
    return this.deps.cursorManager.resetCursor(connectionId);
  }

  async scheduleNextSync(connectionId: string, delayMs: number): Promise<ConnectSyncCursorRow | null> {
    if (!this.deps.cursorManager) return null;
    return this.deps.cursorManager.scheduleNextSync(connectionId, delayMs);
  }

  async validateCursor(connectionId: string): Promise<CursorValidationResult | null> {
    if (!this.deps.cursorManager) return null;
    return this.deps.cursorManager.validateCursor(connectionId);
  }

  async initializeCursor(connectionId: string, provider: AtsProviderId, providerVersion?: string): Promise<ConnectSyncCursorRow | null> {
    if (!this.deps.cursorManager) return null;
    return this.deps.cursorManager.getOrCreate(connectionId, provider, providerVersion);
  }

  async resolveSyncMode(connectionId: string, requested?: SyncImportMode): Promise<SyncImportMode | null> {
    if (!this.deps.cursorManager) return requested ?? "full";
    return this.deps.cursorManager.resolveImportMode(connectionId, requested);
  }

  async recordCursorError(connectionId: string, error: string): Promise<ConnectSyncCursorRow | null> {
    if (!this.deps.cursorManager) return null;
    return this.deps.cursorManager.recordError(connectionId, error);
  }

  private toSummary(row: Awaited<ReturnType<ConnectionRepository["getById"]>> & object): ConnectionSummary {
    return {
      connectionId: row!.id,
      employerAccountId: row!.employerAccountId,
      provider: row!.provider,
      status: row!.status as ConnectionSummary["status"],
      tokenStatus: (row!.tokenStatus as ConnectionSummary["tokenStatus"]) ?? "unknown",
      oauthScopes: row!.oauthScopes,
      providerAccountId: row!.providerAccountId,
      providerAccountName: row!.providerAccountName,
      tokenExpiresAt: row!.tokenExpiresAt,
      lastHealthCheckAt: row!.lastHealthCheckAt,
      lastHealthStatus: row!.lastHealthStatus,
      lastSyncAt: row!.lastSyncAt,
      createdAt: row!.createdAt,
      updatedAt: row!.updatedAt,
    };
  }
}
