import type {
  FeatureFlagSnapshot,
  IntegrationFeatureFlag,
  IntegrationPlatformConfig,
} from "../types/config";
import type { AtsProviderId } from "../types/common";
import type { ProviderConfiguration } from "../types/provider";
import { nowIso } from "../utils/correlation";

const TRUTHY = new Set(["1", "true", "yes", "on"]);

function envFlag(name: string, defaultValue = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return TRUTHY.has(raw.trim().toLowerCase());
}

const PROVIDER_FLAG_MAP: Record<AtsProviderId, IntegrationFeatureFlag | null> = {
  mock: "MOCK_ATS_ENABLED",
  greenhouse: "GREENHOUSE_ENABLED",
  lever: "LEVER_ENABLED",
  ashby: "ASHBY_ENABLED",
  workday: "WORKDAY_ENABLED",
  bamboohr: "BAMBOOHR_ENABLED",
  rippling: "RIPPLING_ENABLED",
  hibob: "HIBOB_ENABLED",
  icims: "ICIMS_ENABLED",
  smartrecruiters: "SMARTRECRUITERS_ENABLED",
};

export class FeatureFlagService {
  isEnabled(flag: IntegrationFeatureFlag): boolean {
    if (flag !== "ATS_ENABLED" && !this.isEnabled("ATS_ENABLED")) {
      return false;
    }
    return envFlag(flag, flag === "MOCK_ATS_ENABLED");
  }

  isProviderEnabled(providerId: AtsProviderId): boolean {
    const flag = PROVIDER_FLAG_MAP[providerId];
    if (!flag) return false;
    return this.isEnabled(flag);
  }

  snapshot(): FeatureFlagSnapshot {
    const flagNames: IntegrationFeatureFlag[] = [
      "ATS_ENABLED",
      "GREENHOUSE_ENABLED",
      "LEVER_ENABLED",
      "ASHBY_ENABLED",
      "WORKDAY_ENABLED",
      "BAMBOOHR_ENABLED",
      "RIPPLING_ENABLED",
      "HIBOB_ENABLED",
      "ICIMS_ENABLED",
      "MOCK_ATS_ENABLED",
      "SMARTRECRUITERS_ENABLED",
    ];

    const flags = {} as Record<IntegrationFeatureFlag, boolean>;
    for (const flag of flagNames) {
      flags[flag] = this.isEnabled(flag);
    }

    return {
      evaluatedAt: nowIso(),
      flags,
    };
  }
}

export class ConfigurationService {
  private readonly overrides: Partial<IntegrationPlatformConfig>;

  constructor(overrides?: Partial<IntegrationPlatformConfig>) {
    this.overrides = overrides ?? {};
  }

  getConfig(): IntegrationPlatformConfig {
    return {
      encryptionKey: this.overrides.encryptionKey ?? process.env.ATS_ENCRYPTION_KEY,
      panelJwtSecret: this.overrides.panelJwtSecret ?? process.env.PANEL_JWT_SECRET,
      cronSecret: this.overrides.cronSecret ?? process.env.CRON_SECRET,
      defaultEventMaxAttempts:
        this.overrides.defaultEventMaxAttempts ??
        Number(process.env.ATS_EVENT_MAX_ATTEMPTS ?? 5),
      defaultRetryBackoffMs:
        this.overrides.defaultRetryBackoffMs ?? [1000, 5000, 15000, 60000, 240000],
      webhookResponseTimeoutMs:
        this.overrides.webhookResponseTimeoutMs ??
        Number(process.env.ATS_WEBHOOK_TIMEOUT_MS ?? 500),
      providers: this.overrides.providers ?? {},
    };
  }

  getProviderConfiguration(providerId: AtsProviderId): ProviderConfiguration | undefined {
    const config = this.getConfig();
    const fromEnv = this.readProviderEnv(providerId);
    return {
      providerId,
      ...fromEnv,
      ...config.providers[providerId],
    };
  }

  private readProviderEnv(providerId: AtsProviderId): Partial<ProviderConfiguration> {
    const prefix = providerId.toUpperCase();
    return {
      clientId: process.env[`${prefix}_CLIENT_ID`],
      clientSecret: process.env[`${prefix}_CLIENT_SECRET`],
      webhookSecret: process.env[`${prefix}_WEBHOOK_SECRET`],
      baseUrl: process.env[`${prefix}_BASE_URL`],
    };
  }
}
