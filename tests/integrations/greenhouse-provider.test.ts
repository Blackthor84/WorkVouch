import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  FeatureFlagService,
  ProviderLoader,
  ProviderRegistry,
  StructuredLoggingService,
} from "@/lib/integrations";
import { MockHttpClient } from "@/lib/integrations/providers/greenhouse/api/http-client";
import {
  createGreenhouseProvider,
  createGreenhouseRegistration,
} from "@/lib/integrations/providers/greenhouse/provider";
import {
  validateGreenhouseConfig,
  resolveGreenhouseConfig,
} from "@/lib/integrations/providers/greenhouse/config/greenhouse-config";
import {
  GREENHOUSE_MANIFEST,
  GREENHOUSE_OAUTH_CONFIG,
  GREENHOUSE_PROVIDER_CAPABILITIES,
} from "@/lib/integrations/providers/greenhouse/config/manifest";
import { GREENHOUSE_PARTNER_SCOPES } from "@/lib/integrations/providers/greenhouse/config/scopes";
import {
  FIXTURE_REFRESH_RESPONSE,
  FIXTURE_TOKEN_RESPONSE,
  FIXTURE_V3_JOBS_PAGE,
} from "@/lib/integrations/providers/greenhouse/fixtures/responses";
import { InMemoryTokenStore } from "@/lib/integrations/providers/greenhouse/auth/token-store";
import { InMemoryOAuthStateStore } from "@/lib/integrations/providers/greenhouse/auth/oauth-state-store";
import type { GreenhouseProviderConfig } from "@/lib/integrations/providers/greenhouse/types";

const TEST_CONFIG: GreenhouseProviderConfig = {
  clientId: "gh-client-id",
  clientSecret: "gh-client-secret",
  webhookSecret: "gh-webhook-secret",
  oauth: GREENHOUSE_OAUTH_CONFIG,
  harvest: {
    baseUrl: "https://harvest.greenhouse.io/v3",
    timeoutMs: 5000,
    maxRetries: 3,
    retryBackoffMs: [100, 200, 400],
  },
};

function createMockHttp(): MockHttpClient {
  const http = new MockHttpClient();

  http.on("auth.greenhouse.io/token", (_url, options) => {
    const authHeader = options.headers?.Authorization ?? "";
    expect(authHeader.startsWith("Basic ")).toBe(true);
    expect(String(options.body ?? "")).toBe("");

    if (_url.includes("grant_type=refresh_token")) {
      return {
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(FIXTURE_REFRESH_RESPONSE),
      };
    }
    return {
      status: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(FIXTURE_TOKEN_RESPONSE),
    };
  });

  http.on("auth.greenhouse.io/oauth/revoke", () => ({
    status: 200,
    headers: {},
    body: "",
  }));

  http.on("harvest.greenhouse.io/v3/jobs", () => ({
    status: 200,
    headers: { link: "" },
    body: JSON.stringify(FIXTURE_V3_JOBS_PAGE),
  }));

  return http;
}

function createTestProvider() {
  const tokenStore = new InMemoryTokenStore();
  const stateStore = new InMemoryOAuthStateStore();
  return createGreenhouseProvider({
    config: TEST_CONFIG,
    http: createMockHttp(),
    tokenStore,
    stateStore,
  });
}

describe("Greenhouse Provider — Harvest V3 Partner OAuth", () => {
  beforeEach(() => {
    process.env.ATS_ENABLED = "true";
    process.env.GREENHOUSE_ENABLED = "true";
    process.env.GREENHOUSE_CLIENT_ID = TEST_CONFIG.clientId;
    process.env.GREENHOUSE_CLIENT_SECRET = TEST_CONFIG.clientSecret;
  });

  afterEach(() => {
    delete process.env.ATS_ENABLED;
    delete process.env.GREENHOUSE_ENABLED;
    delete process.env.GREENHOUSE_CLIENT_ID;
    delete process.env.GREENHOUSE_CLIENT_SECRET;
  });

  it("registers Greenhouse via ProviderLoader", () => {
    const logger = new StructuredLoggingService();
    const featureFlags = new FeatureFlagService();
    const registry = new ProviderRegistry(featureFlags, logger);
    const loader = new ProviderLoader(registry);

    loader.loadBuiltInProviders();

    expect(registry.isRegistered("greenhouse")).toBe(true);
    expect(registry.listProviders().some((p) => p.providerId === "greenhouse")).toBe(true);
  });

  it("blocks Greenhouse when GREENHOUSE_ENABLED is false", () => {
    process.env.GREENHOUSE_ENABLED = "false";
    const logger = new StructuredLoggingService();
    const registry = new ProviderRegistry(new FeatureFlagService(), logger);
    new ProviderLoader(registry).loadBuiltInProviders();

    expect(() => registry.getProvider("greenhouse")).toThrow(/disabled/i);
  });

  it("validates configuration from env and provider config", () => {
    const valid = validateGreenhouseConfig({
      providerId: "greenhouse",
      clientId: TEST_CONFIG.clientId,
      clientSecret: TEST_CONFIG.clientSecret,
      baseUrl: TEST_CONFIG.harvest.baseUrl,
    });
    expect(valid.valid).toBe(true);

    const invalid = validateGreenhouseConfig({
      providerId: "greenhouse",
      clientId: "",
      clientSecret: "",
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.length).toBeGreaterThan(0);
  });

  it("resolves configuration from environment", () => {
    const config = resolveGreenhouseConfig();
    expect(config.clientId).toBe(TEST_CONFIG.clientId);
    expect(config.harvest.baseUrl).toContain("/v3");
  });

  it("exposes provider capabilities and manifest", () => {
    const provider = createTestProvider();
    const capabilities = provider.getCapabilities();

    expect(capabilities.providerId).toBe("greenhouse");
    expect(capabilities.supportsOAuth).toBe(true);
    expect(capabilities.apiVersion).toBe("3.0");
    expect(GREENHOUSE_MANIFEST.supportsCandidates).toBe(true);
    expect(GREENHOUSE_PROVIDER_CAPABILITIES.authenticationType).toBe("oauth2");
    expect(GREENHOUSE_OAUTH_CONFIG.scopes).toEqual([...GREENHOUSE_PARTNER_SCOPES]);
  });

  it("starts Partner OAuth connect without PKCE", async () => {
    const provider = createTestProvider();
    const pending = await provider.connect({
      employerAccountId: "employer-1",
      redirectUri: "https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback",
      state: "",
    });

    expect(pending.status).toBe("pending");
    expect(pending.authorizationUrl).toContain("auth.greenhouse.io/authorize");
    expect(pending.authorizationUrl).not.toContain("code_challenge=");
    expect(pending.authorizationUrl).toContain("scope=harvest%3Acandidates%3Alist");
  });

  it("completes OAuth connect with state validation and Basic-auth token exchange", async () => {
    const provider = createTestProvider();
    const pending = await provider.connect({
      employerAccountId: "employer-1",
      redirectUri: "https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback",
      state: "",
    });

    const authUrl = new URL(pending.authorizationUrl!);
    const state = authUrl.searchParams.get("state")!;

    const connected = await provider.connect({
      employerAccountId: "employer-1",
      redirectUri: "https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback",
      state,
      code: "auth-code-123",
    });

    expect(connected.status).toBe("connected");
    expect(connected.scopes).toContain("harvest:candidates:list");
    expect(connected.connectionId).toBeTruthy();
  });

  it("rejects OAuth completion when state is invalid", async () => {
    const provider = createTestProvider();
    await expect(
      provider.connect({
        employerAccountId: "employer-1",
        redirectUri: "https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback",
        state: "invalid-state",
        code: "auth-code",
      })
    ).rejects.toThrow(/state/i);
  });

  it("refreshes tokens and replaces refresh token", async () => {
    const provider = createTestProvider();
    const pending = await provider.connect({
      employerAccountId: "employer-1",
      redirectUri: "https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback",
      state: "",
    });
    const state = new URL(pending.authorizationUrl!).searchParams.get("state")!;
    const connected = await provider.connect({
      employerAccountId: "employer-1",
      redirectUri: "https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback",
      state,
      code: "auth-code",
    });

    const refreshed = await provider.refreshToken({
      connectionId: connected.connectionId,
      refreshToken: FIXTURE_TOKEN_RESPONSE.refresh_token!,
    });

    expect(refreshed.accessToken).toBe(FIXTURE_REFRESH_RESPONSE.access_token);
    expect(refreshed.scopes).toContain("harvest:jobs:list");
  });

  it("disconnects and revokes tokens", async () => {
    const tokenStore = new InMemoryTokenStore();
    const provider = createGreenhouseProvider({
      config: TEST_CONFIG,
      http: createMockHttp(),
      tokenStore,
      stateStore: new InMemoryOAuthStateStore(),
    });
    const pending = await provider.connect({
      employerAccountId: "employer-1",
      redirectUri: "https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback",
      state: "",
    });
    const state = new URL(pending.authorizationUrl!).searchParams.get("state")!;
    const connected = await provider.connect({
      employerAccountId: "employer-1",
      redirectUri: "https://tryworkvouch.com/api/integrations/v1/connect/greenhouse/callback",
      state,
      code: "auth-code",
    });

    await provider.disconnect({
      connectionId: connected.connectionId,
      employerAccountId: "employer-1",
      revokeToken: true,
    });

    expect(await tokenStore.getConnection(connected.connectionId)).toBeNull();
  });

  it("calls Harvest V3 via testConnection and healthCheck", async () => {
    const provider = createTestProvider();
    const test = await provider.testConnection({
      connectionId: "conn-test",
      accessToken: FIXTURE_TOKEN_RESPONSE.access_token,
    });

    expect(test.success).toBe(true);
    expect(test.message).toContain("/v3/jobs");

    const health = await provider.healthCheck({
      connectionId: "conn-test",
      accessToken: FIXTURE_TOKEN_RESPONSE.access_token,
    });
    expect(health.healthy).toBe(true);
    expect(health.providerAccountName).toContain("/v3/jobs");
  });

  it("retries Harvest requests on rate limit", async () => {
    let attempts = 0;
    const http = new MockHttpClient();
    http.on("harvest.greenhouse.io/v3/jobs", () => {
      attempts += 1;
      if (attempts === 1) {
        return {
          status: 429,
          headers: { "retry-after": "0" },
          body: JSON.stringify({ message: "Rate limited" }),
        };
      }
      return {
        status: 200,
        headers: { link: "" },
        body: JSON.stringify(FIXTURE_V3_JOBS_PAGE),
      };
    });

    const provider = createGreenhouseProvider({
      config: TEST_CONFIG,
      http,
      tokenStore: new InMemoryTokenStore(),
      stateStore: new InMemoryOAuthStateStore(),
    });

    const result = await provider.testConnection({
      connectionId: "conn-rate",
      accessToken: "token",
    });

    expect(result.success).toBe(true);
    expect(attempts).toBeGreaterThan(1);
  });

  it("syncs via Harvest and validates webhook signatures", async () => {
    const provider = createTestProvider();

    const candidateResult = await provider.syncCandidate({
      connectionId: "c1",
      accessToken: "t",
      externalCandidateId: "ext-1",
      direction: "inbound",
    });
    expect(candidateResult.success).toBe(false);
    expect(candidateResult.error?.code).toBe("SYNC_FAILED");

    const invalid = await provider.receiveWebhook({
      connectionId: "c1",
      employerAccountId: "e1",
      rawBody: "{}",
      headers: {},
      webhookSecret: "secret",
    });
    expect(invalid.accepted).toBe(false);
    expect(invalid.error).toContain("signature");
  });

  it("supports manual registration with injected dependencies", () => {
    const logger = new StructuredLoggingService();
    const registry = new ProviderRegistry(new FeatureFlagService(), logger);
    const loader = new ProviderLoader(registry);

    loader.registerExternalProvider(
      createGreenhouseRegistration({
        config: TEST_CONFIG,
        http: createMockHttp(),
        tokenStore: new InMemoryTokenStore(),
        stateStore: new InMemoryOAuthStateStore(),
      })
    );

    const provider = registry.getProvider("greenhouse");
    expect(provider.providerId).toBe("greenhouse");
  });
});
