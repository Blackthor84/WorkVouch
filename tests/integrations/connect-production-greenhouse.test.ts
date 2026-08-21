import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  ConnectionManager,
  ConnectSecureTokenStorage,
  InMemoryConnectionRepository,
  InMemoryOAuthStateRepository,
  InMemoryProviderAccountRepository,
  SupabaseConnectionRepository,
} from "@/lib/integrations";
import { generateCodeVerifier, generateOAuthState } from "@/lib/integrations/providers/greenhouse/auth/pkce";

describe("Greenhouse Connect production schema assumptions", () => {
  describe("SupabaseConnectionRepository", () => {
    it("queries connect_connections (production table name)", async () => {
      const from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: {
                message:
                  "Could not find the table 'public.connect_connections' in the schema cache",
              },
            })
          ),
        })),
      }));

      const repo = new SupabaseConnectionRepository({ from } as never);
      await expect(repo.listByEmployer("ea-1")).rejects.toThrow(/Connection list failed/);
      expect(from).toHaveBeenCalledWith("connect_connections");
    });

    it("surfaces connection lookup failures from missing schema", async () => {
      const from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({
                data: null,
                error: {
                  message:
                    "Could not find the table 'public.connect_connections' in the schema cache",
                },
              })),
            })),
          })),
        })),
      }));

      const repo = new SupabaseConnectionRepository({ from } as never);
      await expect(repo.findByEmployerAndProvider("ea-1", "greenhouse")).rejects.toThrow(
        /Connection lookup failed/
      );
    });
  });

  describe("OAuth lifecycle (in-memory parity with post-migration Supabase)", () => {
    let connectionRepo: InMemoryConnectionRepository;
    let oauthStateRepo: InMemoryOAuthStateRepository;
    let connections: ConnectionManager;

    beforeEach(() => {
      connectionRepo = new InMemoryConnectionRepository();
      oauthStateRepo = new InMemoryOAuthStateRepository();
      connections = new ConnectionManager({
        connections: connectionRepo,
        oauthStates: oauthStateRepo,
        providerAccounts: new InMemoryProviderAccountRepository(),
        tokenStorage: new ConnectSecureTokenStorage(),
      });
    });

    afterEach(() => {
      connectionRepo.clear();
      oauthStateRepo.clear();
    });

    it("startOAuth creates pending Greenhouse connection for wizard", async () => {
      const result = await connections.startOAuth({
        employerAccountId: "ea-1",
        provider: "greenhouse",
        redirectUri: "https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback",
        requiredScopes: ["harvest:read"],
        codeVerifier: generateCodeVerifier(),
        state: generateOAuthState(),
      });

      const row = await connectionRepo.getById(result.connectionId);
      expect(row?.status).toBe("pending");
      expect(row?.provider).toBe("greenhouse");
    });

    it("persists OAuth state until callback consumes it", async () => {
      const state = generateOAuthState();
      const codeVerifier = generateCodeVerifier();

      const result = await connections.startOAuth({
        employerAccountId: "ea-1",
        provider: "greenhouse",
        redirectUri: "https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback",
        requiredScopes: ["harvest:read"],
        codeVerifier,
        state,
      });

      const oauthRecord = await oauthStateRepo.consume(state);
      expect(oauthRecord?.connectionId).toBe(result.connectionId);
      expect(oauthRecord?.redirectUri).toContain("/api/integrations/v1/connect/greenhouse/callback");
    });

    it("completeConnection persists tokens after OAuth callback", async () => {
      const created = await connectionRepo.create({
        id: "conn-callback",
        employerAccountId: "ea-1",
        provider: "greenhouse",
        status: "pending",
        oauthScopes: ["harvest:read"],
        metadata: {},
      });

      await connections.completeConnection({
        connectionId: created.id,
        tokens: {
          accessToken: "access-plain",
          refreshToken: "refresh-plain",
          expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
          scopes: ["harvest:read"],
        },
        providerAccountId: "gh-1",
        providerAccountName: "Sandbox Org",
      });

      const tokens = await connections.getTokens(created.id);
      expect(tokens?.accessToken).toBe("access-plain");
      const row = await connectionRepo.getById(created.id);
      expect(row?.status).toBe("connected");
    });
  });
});