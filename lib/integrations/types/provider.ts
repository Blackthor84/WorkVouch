import type { AtsProviderId, TokenPair, ValidationResult } from "./common";

export type AtsFeature =
  | "oauth"
  | "webhooks"
  | "candidate_sync"
  | "job_sync"
  | "application_sync"
  | "custom_fields"
  | "notes"
  | "bulk_export";

export type ProviderConnectionStatus =
  | "connected"
  | "disconnected"
  | "pending"
  | "token_expired"
  | "error";

export interface ProviderCapabilities {
  providerId: AtsProviderId;
  displayName: string;
  apiVersion: string;
  features: AtsFeature[];
  supportsOAuth: boolean;
  supportsWebhooks: boolean;
  supportsBatchSync: boolean;
  authenticationType: "oauth2" | "oauth2_pkce" | "api_key";
  rateLimits?: {
    requestsPerWindow: number;
    windowSeconds: number;
  };
}

export interface ProviderConfiguration {
  providerId: AtsProviderId;
  clientId?: string;
  clientSecret?: string;
  webhookSecret?: string;
  baseUrl?: string;
  scopes?: string[];
  metadata?: Record<string, unknown>;
}

export interface ConnectParams {
  employerAccountId: string;
  connectionId?: string;
  redirectUri: string;
  state: string;
  code?: string;
  codeVerifier?: string;
  configuration?: ProviderConfiguration;
}

export interface ConnectResult {
  connectionId: string;
  status: ProviderConnectionStatus;
  providerAccountId?: string;
  providerAccountName?: string;
  scopes: string[];
  expiresAt?: string;
  authorizationUrl?: string;
}

export interface DisconnectParams {
  connectionId: string;
  employerAccountId: string;
  revokeToken?: boolean;
}

export interface RefreshTokenParams {
  connectionId: string;
  refreshToken: string;
}

export interface HealthCheckParams {
  connectionId: string;
  accessToken: string;
}

export interface HealthCheckResult {
  healthy: boolean;
  latencyMs: number;
  providerAccountName?: string;
  error?: string;
  checkedAt: string;
}

export interface TestConnectionParams {
  connectionId: string;
  accessToken: string;
  configuration?: ProviderConfiguration;
}

export interface TestConnectionResult {
  success: boolean;
  latencyMs: number;
  message: string;
  checkedAt: string;
}

export interface ProviderRegistration {
  providerId: AtsProviderId;
  displayName: string;
  factory: () => import("../providers/base/AtsProvider").AtsProvider;
  capabilities: ProviderCapabilities;
}

export interface ProviderSummary {
  providerId: AtsProviderId;
  displayName: string;
  capabilities: ProviderCapabilities;
  enabled: boolean;
  registered: boolean;
}

export type { TokenPair, ValidationResult };
