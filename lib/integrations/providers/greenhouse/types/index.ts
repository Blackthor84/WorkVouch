import type { TokenPair } from "../../../types/common";

export interface GreenhouseOAuthConfig {
  authorizationUrl: string;
  tokenUrl: string;
  revokeUrl: string;
  scopes: string[];
  pkceRequired: boolean;
}

export interface GreenhouseHarvestConfig {
  baseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  retryBackoffMs: number[];
}

export interface GreenhouseProviderConfig {
  clientId: string;
  clientSecret: string;
  webhookSecret?: string;
  oauth: GreenhouseOAuthConfig;
  harvest: GreenhouseHarvestConfig;
}

export interface StoredGreenhouseConnection {
  connectionId: string;
  employerAccountId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  scopes: string[];
  providerAccountId?: string;
  providerAccountName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredOAuthState {
  state: string;
  employerAccountId: string;
  codeVerifier: string;
  redirectUri: string;
  expiresAt: string;
  createdAt: string;
}

export interface GreenhouseTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export interface HarvestUser {
  id: number;
  name: string;
  email: string;
}

export interface HttpRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: string | URLSearchParams;
  timeoutMs?: number;
}

export interface HttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface HttpClient {
  request(url: string, options: HttpRequestOptions): Promise<HttpResponse>;
}

export interface TokenStore {
  saveConnection(connection: StoredGreenhouseConnection): Promise<void>;
  getConnection(connectionId: string): Promise<StoredGreenhouseConnection | null>;
  deleteConnection(connectionId: string): Promise<void>;
  updateTokens(connectionId: string, tokens: TokenPair): Promise<void>;
}

export interface OAuthStateStore {
  saveState(state: StoredOAuthState): Promise<void>;
  consumeState(state: string): Promise<StoredOAuthState | null>;
  purgeExpired(): Promise<number>;
}

export interface SecureTokenStorage {
  encrypt(plaintext: string): string;
  decrypt(ciphertext: string): string;
}

export type GreenhouseCapabilityFlags = {
  supportsOAuth: boolean;
  supportsWebhooks: boolean;
  supportsCandidates: boolean;
  supportsJobs: boolean;
  supportsApplications: boolean;
  supportsCustomFields: boolean;
  supportsStatusSync: boolean;
  supportsReferenceRequests: boolean;
  supportsBatchSync: boolean;
  supportsAttachments: boolean;
};
