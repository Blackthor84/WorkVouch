import { randomUUID } from "crypto";
import type { ConnectParams, ConnectResult, TokenPair } from "../../../types/provider";
import type {
  GreenhouseProviderConfig,
  GreenhouseTokenResponse,
  HttpClient,
  OAuthStateStore,
  StoredGreenhouseConnection,
  TokenStore,
} from "../types";
import { IntegrationPlatformError } from "../../../utils/errors";
import { nowIso } from "../../../utils/correlation";
import { generateCodeChallenge, generateCodeVerifier, generateOAuthState } from "./pkce";
import { createOAuthStateRecord } from "./oauth-state-store";

function buildBasicAuthHeader(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64")}`;
}

export class GreenhouseOAuthService {
  constructor(
    private readonly config: GreenhouseProviderConfig,
    private readonly http: HttpClient,
    private readonly tokenStore: TokenStore,
    private readonly stateStore: OAuthStateStore
  ) {}

  async startConnect(params: ConnectParams): Promise<ConnectResult> {
    const pkceRequired = this.config.oauth.pkceRequired;
    const codeVerifier = pkceRequired
      ? params.codeVerifier ?? generateCodeVerifier()
      : params.codeVerifier ?? "";
    const state = params.state || generateOAuthState();
    const connectionId = params.connectionId ?? randomUUID();

    if (!params.connectionId) {
      await this.stateStore.saveState(
        createOAuthStateRecord({
          state,
          employerAccountId: params.employerAccountId,
          codeVerifier,
          redirectUri: params.redirectUri,
          connectionId,
        })
      );
    }

    const url = new URL(this.config.oauth.authorizationUrl);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", this.config.clientId);
    url.searchParams.set("redirect_uri", params.redirectUri);
    url.searchParams.set("scope", this.config.oauth.scopes.join(" "));
    url.searchParams.set("state", state);

    if (pkceRequired) {
      url.searchParams.set("code_challenge", generateCodeChallenge(codeVerifier));
      url.searchParams.set("code_challenge_method", "S256");
    }

    return {
      connectionId,
      status: "pending",
      scopes: this.config.oauth.scopes,
      authorizationUrl: url.toString(),
    };
  }

  async completeConnect(params: ConnectParams): Promise<ConnectResult> {
    if (!params.code) {
      throw new IntegrationPlatformError({
        code: "OAUTH_CODE_MISSING",
        message: "Authorization code is required to complete Greenhouse OAuth.",
        retryable: false,
        provider: "greenhouse",
      });
    }

    const storedState = await this.stateStore.consumeState(params.state);
    if (!storedState) {
      throw new IntegrationPlatformError({
        code: "OAUTH_STATE_MISMATCH",
        message: "OAuth state is invalid or expired.",
        retryable: false,
        provider: "greenhouse",
      });
    }

    if (storedState.employerAccountId !== params.employerAccountId) {
      throw new IntegrationPlatformError({
        code: "OAUTH_STATE_MISMATCH",
        message: "OAuth state employer mismatch.",
        retryable: false,
        provider: "greenhouse",
      });
    }

    const tokenResponse = await this.exchangeAuthorizationCode({
      code: params.code,
    });

    const connectionId = storedState.connectionId ?? randomUUID();
    const tokenPair = this.toTokenPair(tokenResponse);
    const now = nowIso();

    const connection: StoredGreenhouseConnection = {
      connectionId,
      employerAccountId: params.employerAccountId,
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken ?? "",
      expiresAt: tokenPair.expiresAt,
      scopes: tokenPair.scopes,
      createdAt: now,
      updatedAt: now,
    };

    await this.tokenStore.saveConnection(connection);

    return {
      connectionId,
      status: "connected",
      scopes: tokenPair.scopes,
      expiresAt: tokenPair.expiresAt,
    };
  }

  async refresh(refreshToken: string, connectionId: string): Promise<TokenPair> {
    const tokenUrl = new URL(this.config.oauth.tokenUrl);
    tokenUrl.searchParams.set("grant_type", "refresh_token");
    tokenUrl.searchParams.set("refresh_token", refreshToken);

    const response = await this.http.request(tokenUrl.toString(), {
      method: "POST",
      headers: {
        Authorization: buildBasicAuthHeader(this.config.clientId, this.config.clientSecret),
      },
      body: "",
    });

    if (response.status >= 400) {
      throw new IntegrationPlatformError({
        code: "OAUTH_TOKEN_EXPIRED",
        message: "Greenhouse refresh token is invalid or expired.",
        retryable: false,
        provider: "greenhouse",
      });
    }

    const tokenResponse = JSON.parse(response.body) as GreenhouseTokenResponse;
    const tokenPair = this.toTokenPair(tokenResponse);
    await this.tokenStore.updateTokens(connectionId, tokenPair);
    return tokenPair;
  }

  async revoke(accessToken: string): Promise<void> {
    const body = new URLSearchParams({
      token: accessToken,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    await this.http.request(this.config.oauth.revokeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  }

  private async exchangeAuthorizationCode(input: {
    code: string;
  }): Promise<GreenhouseTokenResponse> {
    const tokenUrl = new URL(this.config.oauth.tokenUrl);
    tokenUrl.searchParams.set("grant_type", "authorization_code");
    tokenUrl.searchParams.set("code", input.code);

    const response = await this.http.request(tokenUrl.toString(), {
      method: "POST",
      headers: {
        Authorization: buildBasicAuthHeader(this.config.clientId, this.config.clientSecret),
      },
      body: "",
    });

    if (response.status >= 400) {
      throw new IntegrationPlatformError({
        code: "OAUTH_TOKEN_EXCHANGE_FAILED",
        message: `Greenhouse token exchange failed with status ${response.status}.`,
        retryable: false,
        provider: "greenhouse",
      });
    }

    return JSON.parse(response.body) as GreenhouseTokenResponse;
  }

  private toTokenPair(response: GreenhouseTokenResponse): TokenPair {
    const expiresAt =
      response.expires_at ??
      new Date(Date.now() + (response.expires_in ?? 3600) * 1000).toISOString();
    const scopes = response.scope
      ? response.scope.split(" ").filter(Boolean)
      : this.config.oauth.scopes;

    return {
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      expiresAt,
      scopes,
    };
  }
}
