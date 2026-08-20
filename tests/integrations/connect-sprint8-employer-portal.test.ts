import { describe, expect, it, vi } from "vitest";
import { buildProviderCards, getConnectionStats } from "@/lib/employer/integrations/service";
import type { ConnectRuntime } from "@/lib/integrations/connect/connect-runtime";
import type { ConnectionSummary } from "@/lib/integrations/connect/connection/types";

function mockRuntime(connections: ConnectionSummary[]): ConnectRuntime {
  return {
    connections: {
      listByEmployer: vi.fn().mockResolvedValue(connections),
      getCursor: vi.fn().mockResolvedValue({ nextScheduledSync: null, lastSuccessfulSync: "2026-08-08T00:00:00Z" }),
    },
    health: {
      evaluate: vi.fn().mockResolvedValue({
        overallScore: 92,
        overallStatus: "healthy",
        components: [],
        evaluatedAt: new Date().toISOString(),
        connectVersion: "1.0.0",
      }),
    },
  } as unknown as ConnectRuntime;
}

describe("WorkVouch Connect — Sprint 8 Employer Portal", () => {
  it("builds provider cards with greenhouse not connected", async () => {
    const cards = await buildProviderCards(mockRuntime([]), "employer-test");
    const gh = cards.find((c) => c.provider === "greenhouse");
    expect(gh?.status).toBe("not_connected");
    expect(gh?.connectVersion).toBeTruthy();
  });

  it("builds provider cards when greenhouse is connected", async () => {
    const connection: ConnectionSummary = {
      connectionId: "conn-1",
      employerAccountId: "employer-test",
      provider: "greenhouse",
      status: "connected",
      tokenStatus: "valid",
      oauthScopes: ["harvest:read"],
      metadata: {
        sync_preferences: { automation: { auto_invite_enabled: true, auto_invite_trigger: "final_interview" } },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cards = await buildProviderCards(mockRuntime([connection]), "employer-test");
    const gh = cards.find((c) => c.provider === "greenhouse");
    expect(gh?.status).toBe("connected");
    expect(gh?.healthScore).toBe(92);
    expect(gh?.stats?.automationEnabled).toBe(true);
  });

  it("returns connection stats with automation prefs", async () => {
    const connection: ConnectionSummary = {
      connectionId: "conn-2",
      employerAccountId: "employer-stats",
      provider: "greenhouse",
      status: "connected",
      tokenStatus: "valid",
      oauthScopes: [],
      metadata: {
        sync_preferences: { automation: { auto_invite_enabled: false, auto_invite_trigger: "manual" } },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const stats = await getConnectionStats(mockRuntime([connection]), connection);
    expect(stats.automationEnabled).toBe(false);
    expect(stats.eventsProcessed).toBe(0);
  });
});
