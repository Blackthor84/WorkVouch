import type { ProviderConfiguration } from "../../../types/provider";
import type { ValidationResult } from "../../../types/common";
import type { GreenhouseProviderConfig } from "../types";
import { GREENHOUSE_OAUTH_CONFIG } from "./manifest";

const DEFAULT_HARVEST_BASE_URL = "https://harvest.greenhouse.io/v1";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 5;

export function loadGreenhouseConfigFromEnv(): GreenhouseProviderConfig | null {
  const clientId = process.env.GREENHOUSE_CLIENT_ID;
  const clientSecret = process.env.GREENHOUSE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  return {
    clientId,
    clientSecret,
    webhookSecret: process.env.GREENHOUSE_WEBHOOK_SECRET,
    oauth: GREENHOUSE_OAUTH_CONFIG,
    harvest: {
      baseUrl: process.env.GREENHOUSE_BASE_URL ?? DEFAULT_HARVEST_BASE_URL,
      timeoutMs: Number(process.env.GREENHOUSE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS),
      maxRetries: Number(process.env.GREENHOUSE_MAX_RETRIES ?? DEFAULT_MAX_RETRIES),
      retryBackoffMs: [1000, 2000, 4000, 8000, 16000],
    },
  };
}

export function resolveGreenhouseConfig(
  providerConfiguration?: ProviderConfiguration
): GreenhouseProviderConfig {
  const fromEnv = loadGreenhouseConfigFromEnv();
  if (providerConfiguration?.clientId && providerConfiguration.clientSecret) {
    return {
      clientId: providerConfiguration.clientId,
      clientSecret: providerConfiguration.clientSecret,
      webhookSecret: providerConfiguration.webhookSecret,
      oauth: GREENHOUSE_OAUTH_CONFIG,
      harvest: {
        baseUrl: providerConfiguration.baseUrl ?? fromEnv?.harvest.baseUrl ?? DEFAULT_HARVEST_BASE_URL,
        timeoutMs: fromEnv?.harvest.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        maxRetries: fromEnv?.harvest.maxRetries ?? DEFAULT_MAX_RETRIES,
        retryBackoffMs: fromEnv?.harvest.retryBackoffMs ?? [1000, 2000, 4000, 8000, 16000],
      },
    };
  }

  if (!fromEnv) {
    throw new Error(
      "Greenhouse configuration missing. Set GREENHOUSE_CLIENT_ID and GREENHOUSE_CLIENT_SECRET."
    );
  }

  return fromEnv;
}

export function validateGreenhouseConfig(
  config?: ProviderConfiguration
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const clientId = config?.clientId ?? process.env.GREENHOUSE_CLIENT_ID;
  const clientSecret = config?.clientSecret ?? process.env.GREENHOUSE_CLIENT_SECRET;

  if (!clientId) errors.push("GREENHOUSE_CLIENT_ID is required");
  if (!clientSecret) errors.push("GREENHOUSE_CLIENT_SECRET is required");

  const baseUrl = config?.baseUrl ?? process.env.GREENHOUSE_BASE_URL ?? DEFAULT_HARVEST_BASE_URL;
  if (!baseUrl.startsWith("https://")) {
    errors.push("Harvest base URL must use HTTPS");
  }

  if (!process.env.GREENHOUSE_WEBHOOK_SECRET && !config?.webhookSecret) {
    warnings.push("GREENHOUSE_WEBHOOK_SECRET not set — webhooks will fail when implemented");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateGreenhouseConfigOnStartup(): ValidationResult {
  return validateGreenhouseConfig();
}
