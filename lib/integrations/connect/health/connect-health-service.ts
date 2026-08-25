import type { AtsProviderId } from "../../types/common";
import type { ConnectionManager } from "../connection/connection-manager";
import type { ConnectEventStore } from "../event-store/connect-event-store";
import type { ProjectionEngine } from "../projection/projection-engine";
import type { SnapshotService } from "../event-store/snapshot-service";
import type { SyncCursorManager } from "../sync/sync-cursor-manager";
import { CONNECT_PLATFORM_VERSION } from "../version";
import { nowIso } from "../../utils/correlation";

export type HealthComponentStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

export interface ConnectHealthComponent {
  name: string;
  status: HealthComponentStatus;
  message: string;
  latencyMs?: number;
  metadata?: Record<string, unknown>;
}

export interface ConnectHealthReport {
  evaluatedAt: string;
  connectVersion: string;
  overallScore: number;
  overallStatus: HealthComponentStatus;
  components: ConnectHealthComponent[];
  connection?: {
    connectionId: string;
    provider: AtsProviderId;
    employerAccountId: string;
    oauthStatus: HealthComponentStatus;
    connectionStatus: string;
    tokenExpiresAt?: string;
    eventsStored?: number;
    projectionLag?: number;
  };
}

export interface ConnectHealthServiceDeps {
  connections: ConnectionManager;
  eventStore?: ConnectEventStore;
  projections?: ProjectionEngine;
  snapshots?: SnapshotService;
  cursorManager?: SyncCursorManager;
  providerVersion?: string;
  testHarvest?: (accessToken: string) => Promise<{
    healthy: boolean;
    latencyMs: number;
    error?: string;
    endpoints?: Array<{ path: string; healthy: boolean; latencyMs: number; error?: string }>;
  }>;
}

/** Internal-only Connect health dashboard — no UI. */
export class ConnectHealthService {
  constructor(private readonly deps: ConnectHealthServiceDeps) {}

  async evaluate(connectionId: string): Promise<ConnectHealthReport> {
    const components: ConnectHealthComponent[] = [];
    const summary = await this.deps.connections.getConnection(connectionId);
    const tokens = await this.deps.connections.getTokens(connectionId);

    components.push({
      name: "platform",
      status: "healthy",
      message: `WorkVouch Connect ${CONNECT_PLATFORM_VERSION}`,
      metadata: { version: CONNECT_PLATFORM_VERSION },
    });

    components.push({
      name: "provider",
      status: summary ? "healthy" : "unhealthy",
      message: summary ? `${summary.provider} provider registered` : "Connection not found",
      metadata: { providerVersion: this.deps.providerVersion ?? "1.0.0" },
    });

    const oauthStatus = this.evaluateOAuth(summary, tokens);
    components.push({
      name: "oauth",
      status: oauthStatus,
      message: oauthStatus === "healthy" ? "OAuth tokens valid" : "OAuth tokens missing or expired",
      metadata: {
        tokenExpiresAt: summary?.tokenExpiresAt,
        scopes: summary?.oauthScopes,
      },
    });

    components.push({
      name: "connection",
      status: summary?.status === "connected" ? "healthy" : "degraded",
      message: `Connection status: ${summary?.status ?? "unknown"}`,
      metadata: {
        lastHealthStatus: summary?.lastHealthStatus,
        lastSyncAt: summary?.lastSyncAt,
      },
    });

    if (this.deps.testHarvest && tokens) {
      const harvest = await this.deps.testHarvest(tokens.accessToken);
      if (harvest.endpoints?.length) {
        for (const endpoint of harvest.endpoints) {
          components.push({
            name: `harvest${endpoint.path.replace(/\//g, "-")}`,
            status: endpoint.healthy ? "healthy" : "unhealthy",
            message: endpoint.error ?? `GET /v3${endpoint.path}?per_page=1 reachable`,
            latencyMs: endpoint.latencyMs,
          });
        }
      } else {
        components.push({
          name: "harvest",
          status: harvest.healthy ? "healthy" : "unhealthy",
          message: harvest.error ?? "Harvest API reachable",
          latencyMs: harvest.latencyMs,
        });
      }
    }

    if (this.deps.eventStore) {
      const timeline = await this.deps.eventStore.loadTimeline({ companyId: summary?.employerAccountId, limit: 1 });
      components.push({
        name: "persistence",
        status: "healthy",
        message: "Event store accessible",
        metadata: { recentEvents: timeline.length },
      });
      components.push({
        name: "database",
        status: "healthy",
        message: "Connect persistence layer reachable",
      });
    }

    components.push({
      name: "replay",
      status: this.deps.eventStore ? "healthy" : "unknown",
      message: this.deps.eventStore ? "Replay engine available" : "Event store not configured",
    });

    components.push({
      name: "projection",
      status: this.deps.projections ? "healthy" : "unknown",
      message: this.deps.projections ? "Projection engine available" : "Projections not configured",
    });

    components.push({
      name: "snapshots",
      status: this.deps.snapshots ? "healthy" : "unknown",
      message: this.deps.snapshots ? "Snapshot service available" : "Snapshots not configured",
    });

    if (this.deps.cursorManager) {
      const cursorValidation = await this.deps.cursorManager.validateCursor(connectionId);
      const cursorStatusMap: Record<string, HealthComponentStatus> = {
        healthy: "healthy",
        behind: "degraded",
        missing: "unhealthy",
        corrupted: "unhealthy",
        expired: "degraded",
      };
      components.push({
        name: "cursor",
        status: cursorStatusMap[cursorValidation.status] ?? "unknown",
        message: `Sync cursor: ${cursorValidation.status}`,
        metadata: {
          estimatedSyncLagMs: cursorValidation.estimatedSyncLagMs,
          estimatedObjectsRemaining: cursorValidation.estimatedObjectsRemaining,
          warnings: cursorValidation.warnings,
        },
      });
    }

    const overallScore = this.calculateScore(components);
    const overallStatus = this.scoreToStatus(overallScore);

    return {
      evaluatedAt: nowIso(),
      connectVersion: CONNECT_PLATFORM_VERSION,
      overallScore,
      overallStatus,
      components,
      connection: summary
        ? {
            connectionId: summary.connectionId,
            provider: summary.provider,
            employerAccountId: summary.employerAccountId,
            oauthStatus,
            connectionStatus: summary.status,
            tokenExpiresAt: summary.tokenExpiresAt,
          }
        : undefined,
    };
  }

  private evaluateOAuth(
    summary: Awaited<ReturnType<ConnectionManager["getConnection"]>>,
    tokens: Awaited<ReturnType<ConnectionManager["getTokens"]>>
  ): HealthComponentStatus {
    if (!summary || !tokens) return "unhealthy";
    if (this.deps.connections.isTokenExpired(tokens.expiresAt)) return "degraded";
    return "healthy";
  }

  private calculateScore(components: ConnectHealthComponent[]): number {
    if (components.length === 0) return 0;
    const weights: Record<HealthComponentStatus, number> = {
      healthy: 100,
      degraded: 60,
      unhealthy: 0,
      unknown: 50,
    };
    const total = components.reduce((sum, c) => sum + weights[c.status], 0);
    return Math.round(total / components.length);
  }

  private scoreToStatus(score: number): HealthComponentStatus {
    if (score >= 85) return "healthy";
    if (score >= 60) return "degraded";
    return "unhealthy";
  }
}
