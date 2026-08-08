import type { ConnectionManager } from "../connection/connection-manager";
import type { LoggingService } from "../../logging/LoggingService";
import { createCorrelationId, nowIso } from "../../utils/correlation";

export interface RecoveryEvent {
  correlationId: string;
  connectionId: string;
  action: "oauth_refresh" | "retry" | "reconnect" | "partial_failure";
  success: boolean;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface RefreshTokensFn {
  (refreshToken: string, connectionId: string): Promise<{ accessToken: string; refreshToken?: string; expiresAt: string; scopes: string[] }>;
}

/** Failure recovery with OAuth refresh, retry, and reconnect support. */
export class ConnectRecoveryService {
  private readonly events: RecoveryEvent[] = [];

  constructor(
    private readonly connections: ConnectionManager,
    private readonly logger: LoggingService,
    private readonly refreshFn?: RefreshTokensFn
  ) {}

  async ensureValidToken(connectionId: string): Promise<{ accessToken: string; refreshed: boolean }> {
    const tokens = await this.connections.getTokens(connectionId);
    if (!tokens) throw new Error("No tokens for connection");

    if (!this.connections.isTokenExpired(tokens.expiresAt)) {
      return { accessToken: tokens.accessToken, refreshed: false };
    }

    if (!this.refreshFn || !tokens.refreshToken) {
      await this.connections.markExpired(connectionId);
      this.record(connectionId, "oauth_refresh", false, "Token expired and no refresh available");
      throw new Error("Token expired — reconnect required");
    }

    return this.refreshWithBackoff(connectionId, tokens.refreshToken);
  }

  async refreshWithBackoff(connectionId: string, refreshToken: string, attempt = 1): Promise<{ accessToken: string; refreshed: boolean }> {
    const correlationId = createCorrelationId("recovery");
    const maxAttempts = 5;
    const backoffMs = [1000, 2000, 4000, 8000, 16000];

    try {
      if (!this.refreshFn) throw new Error("Refresh not configured");
      const refreshed = await this.refreshFn(refreshToken, connectionId);
      await this.connections.refreshTokens(connectionId, refreshed);
      this.record(connectionId, "oauth_refresh", true, "Token refreshed", { correlationId, attempt });
      return { accessToken: refreshed.accessToken, refreshed: true };
    } catch (error) {
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs[attempt - 1] ?? 1000));
        return this.refreshWithBackoff(connectionId, refreshToken, attempt + 1);
      }

      await this.connections.markExpired(connectionId);
      this.record(connectionId, "oauth_refresh", false, error instanceof Error ? error.message : "Refresh failed", {
        correlationId,
        attempt,
      });
      throw error;
    }
  }

  record(connectionId: string, action: RecoveryEvent["action"], success: boolean, message: string, metadata?: Record<string, unknown>): RecoveryEvent {
    const event: RecoveryEvent = {
      correlationId: createCorrelationId("recovery"),
      connectionId,
      action,
      success,
      message,
      timestamp: nowIso(),
      metadata,
    };
    this.events.push(event);
    this.logger.info("Connect recovery event", {
      provider: "platform",
      correlationId: event.correlationId,
      event: `connect.recovery.${action}`,
      metadata: { connectionId, success, message, ...metadata },
    });
    return event;
  }

  getEvents(connectionId?: string): RecoveryEvent[] {
    return connectionId ? this.events.filter((e) => e.connectionId === connectionId) : [...this.events];
  }

  clear(): void {
    this.events.length = 0;
  }
}
