import type { ProviderCapabilities } from "../../../types/provider";
import type { GreenhouseCapabilityFlags, GreenhouseOAuthConfig } from "../types";

export const GREENHOUSE_OAUTH_CONFIG: GreenhouseOAuthConfig = {
  authorizationUrl: "https://auth.greenhouse.io/oauth/authorize",
  tokenUrl: "https://auth.greenhouse.io/oauth/token",
  revokeUrl: "https://auth.greenhouse.io/oauth/revoke",
  scopes: ["harvest:read", "harvest:write", "harvest:webhooks"],
  pkceRequired: true,
};

export const GREENHOUSE_CAPABILITY_FLAGS: GreenhouseCapabilityFlags = {
  supportsOAuth: true,
  supportsWebhooks: true,
  supportsCandidates: true,
  supportsJobs: true,
  supportsApplications: true,
  supportsCustomFields: true,
  supportsStatusSync: true,
  supportsReferenceRequests: false,
  supportsBatchSync: true,
  supportsAttachments: false,
};

export const GREENHOUSE_PROVIDER_CAPABILITIES: ProviderCapabilities = {
  providerId: "greenhouse",
  displayName: "Greenhouse",
  apiVersion: "1.0",
  features: [
    "oauth",
    "webhooks",
    "candidate_sync",
    "job_sync",
    "application_sync",
    "custom_fields",
    "notes",
    "bulk_export",
  ],
  supportsOAuth: GREENHOUSE_CAPABILITY_FLAGS.supportsOAuth,
  supportsWebhooks: GREENHOUSE_CAPABILITY_FLAGS.supportsWebhooks,
  supportsBatchSync: GREENHOUSE_CAPABILITY_FLAGS.supportsBatchSync,
  authenticationType: "oauth2_pkce",
  rateLimits: {
    requestsPerWindow: 50,
    windowSeconds: 10,
  },
};

export const GREENHOUSE_MANIFEST = {
  provider: "greenhouse" as const,
  displayName: "Greenhouse",
  version: "1.0.0",
  apiVersion: "1.0",
  compatibleConnectVersion: "1.0.0",
  minimumConnectVersion: "1.0.0",
  maximumTestedConnectVersion: "1.0.0",
  logoUrl: "https://workvouch.com/integrations/greenhouse-logo.svg",
  docsUrl: "https://docs.workvouch.com/integrations/greenhouse",
  status: "available" as const,
  ...GREENHOUSE_CAPABILITY_FLAGS,
  authenticationType: "oauth2_pkce" as const,
  oauthConfig: GREENHOUSE_OAUTH_CONFIG,
  rateLimits: {
    requestsPerWindow: 50,
    windowSeconds: 10,
    retryAfterHeader: true,
  },
  retryPolicy: {
    maxAttempts: 5,
    backoffMs: [1000, 2000, 4000, 8000, 16000],
    retryOnStatus: [429, 500, 502, 503, 504],
  },
  availableFromSprint: 3,
};
