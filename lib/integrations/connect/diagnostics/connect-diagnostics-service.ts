import type { ConfigurationService, FeatureFlagService } from "../../config";
import type { ProviderRegistry } from "../../registry/ProviderRegistry";
import type { HealthService } from "../../health/HealthService";
import type { AtsProvider } from "../../providers/base/AtsProvider";
import type { ConnectDiagnosticsReport } from "../types";
import { WORKVOUCH_CONNECT_NAME } from "../types";
import { nowIso } from "../../utils/correlation";

export class ConnectDiagnosticsService {
  constructor(
    private readonly config: ConfigurationService,
    private readonly featureFlags: FeatureFlagService,
    private readonly registry: ProviderRegistry,
    private readonly health: HealthService,
    private readonly getProvider?: (providerId: string) => AtsProvider | undefined
  ) {}

  runDiagnostics(): ConnectDiagnosticsReport {
    const flags = this.featureFlags.snapshot().flags;
    const providers = this.registry.listProviders().map((provider) => ({
      providerId: provider.providerId,
      registered: provider.registered,
      enabled: provider.enabled,
      capabilities: provider.capabilities as unknown as Record<string, unknown>,
    }));

    const envIssues: string[] = [];
    if (!process.env.ATS_ENABLED) envIssues.push("ATS_ENABLED not set");
    if (!process.env.ATS_ENCRYPTION_KEY) {
      envIssues.push("ATS_ENCRYPTION_KEY not set (dev fallback active)");
    }

    const configValidation = this.validateConfiguration();

    return {
      platform: WORKVOUCH_CONNECT_NAME,
      evaluatedAt: nowIso(),
      configuration: configValidation,
      featureFlags: flags as unknown as Record<string, boolean>,
      providers,
      environment: { valid: envIssues.length === 0, issues: envIssues },
      oauthHealth: this.checkOAuthHealth(),
      tokenStatus: { status: "in_memory", message: "Token stores are in-memory (Sprint 3B-1)" },
    };
  }

  validateConfiguration(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const platformConfig = this.config.getConfig();

    if (!this.featureFlags.isEnabled("ATS_ENABLED")) {
      warnings.push("ATS_ENABLED is false — platform disabled");
    }
    if (!platformConfig.encryptionKey) {
      warnings.push("ATS_ENCRYPTION_KEY missing");
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  inspectProviderRegistration() {
    return this.registry.listProviders();
  }

  inspectFeatureFlags() {
    return this.featureFlags.snapshot();
  }

  inspectCapabilities(providerId: string) {
    try {
      return this.registry.getCapabilities(providerId as never);
    } catch {
      return undefined;
    }
  }

  async inspectProviderHealth(provider: AtsProvider, input?: { connectionId?: string; accessToken?: string; employerAccountId?: string }) {
    return this.health.evaluate({
      provider,
      connectionId: input?.connectionId,
      accessToken: input?.accessToken,
      employerAccountId: input?.employerAccountId,
      configuration: this.config.getProviderConfiguration(provider.providerId),
    });
  }

  validateEnvironment(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    if (!process.env.ATS_ENABLED) issues.push("ATS_ENABLED not configured");
    return { valid: issues.length === 0, issues };
  }

  private checkOAuthHealth(): { healthy: boolean; message?: string } {
    const enabledProviders = this.registry.listProviders().filter((p) => p.enabled && p.capabilities.supportsOAuth);
    if (enabledProviders.length === 0) {
      return { healthy: true, message: "No OAuth providers enabled" };
    }
    return { healthy: true, message: `${enabledProviders.length} OAuth provider(s) enabled` };
  }
}
