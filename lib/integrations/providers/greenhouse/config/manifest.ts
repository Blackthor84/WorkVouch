import type { ProviderCapabilities } from "../../../types/provider";
import type { GreenhouseCapabilityFlags, GreenhouseOAuthConfig } from "../types";
import { GREENHOUSE_PARTNER_SCOPES } from "./scopes";

/** Partner OAuth endpoints — Harvest V3 Authorization Code Grant. */
export const GREENHOUSE_OAUTH_CONFIG: GreenhouseOAuthConfig = {
  authorizationUrl: "https://auth.greenhouse.io/authorize",
  tokenUrl: "https://auth.greenhouse.io/token",
  /** Revoke is not documented for Partner OAuth; kept for best-effort local disconnect only. */
  revokeUrl: "https://auth.greenhouse.io/oauth/revoke",
  scopes: [...GREENHOUSE_PARTNER_SCOPES],
  pkceRequired: false,
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
  apiVersion: "3.0",
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
  authenticationType: "oauth2",
  rateLimits: {
    requestsPerWindow: 50,
    windowSeconds: 10,
  },
};

export const GREENHOUSE_MANIFEST = {
  provider: "greenhouse" as const,
  displayName: "Greenhouse",
  version: "3.0.0",
  apiVersion: "3.0",
  compatibleConnectVersion: "1.0.0",
  minimumConnectVersion: "1.0.0",
  maximumTestedConnectVersion: "1.0.0",
  logoUrl: "https://workvouch.com/integrations/greenhouse-logo.svg",
  docsUrl: "https://docs.workvouch.com/integrations/greenhouse",
  status: "available" as const,
  ...GREENHOUSE_CAPABILITY_FLAGS,
  authenticationType: "oauth2" as const,
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
