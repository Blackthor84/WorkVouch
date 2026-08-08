import type { AtsProvider } from "../providers/base/AtsProvider";
import type {
  ProviderCapabilities,
  ProviderRegistration,
  ProviderSummary,
} from "../types/provider";
import type { AtsProviderId } from "../types/common";
import { IntegrationPlatformError } from "../utils/errors";
import type { FeatureFlagService } from "../config/ConfigurationService";
import type { LoggingService } from "../logging/LoggingService";

export class ProviderRegistry {
  private readonly providers = new Map<AtsProviderId, ProviderRegistration>();

  constructor(
    private readonly featureFlags: FeatureFlagService,
    private readonly logger: LoggingService
  ) {}

  registerProvider(registration: ProviderRegistration): void {
    if (this.providers.has(registration.providerId)) {
      throw new IntegrationPlatformError({
        code: "PROVIDER_ALREADY_REGISTERED",
        message: `Provider ${registration.providerId} is already registered.`,
        retryable: false,
        provider: registration.providerId,
      });
    }

    this.providers.set(registration.providerId, registration);
    this.logger.info("Provider registered", {
      provider: registration.providerId,
      event: "provider.registered",
    });
  }

  getProvider(providerId: AtsProviderId): AtsProvider {
    this.validateProvider(providerId);
    const registration = this.providers.get(providerId);
    if (!registration) {
      throw new IntegrationPlatformError({
        code: "PROVIDER_NOT_FOUND",
        message: `Provider ${providerId} is not registered.`,
        retryable: false,
        provider: providerId,
      });
    }
    return registration.factory();
  }

  listProviders(): ProviderSummary[] {
    return Array.from(this.providers.values()).map((registration) => ({
      providerId: registration.providerId,
      displayName: registration.displayName,
      capabilities: registration.capabilities,
      enabled: this.featureFlags.isProviderEnabled(registration.providerId),
      registered: true,
    }));
  }

  validateProvider(providerId: AtsProviderId): void {
    if (!this.providers.has(providerId)) {
      throw new IntegrationPlatformError({
        code: "PROVIDER_NOT_FOUND",
        message: `Provider ${providerId} is not registered.`,
        retryable: false,
        provider: providerId,
      });
    }

    if (!this.featureFlags.isProviderEnabled(providerId)) {
      throw new IntegrationPlatformError({
        code: "PROVIDER_DISABLED",
        message: `Provider ${providerId} is disabled by feature flag.`,
        retryable: false,
        provider: providerId,
      });
    }
  }

  getCapabilities(providerId: AtsProviderId): ProviderCapabilities {
    const registration = this.providers.get(providerId);
    if (!registration) {
      throw new IntegrationPlatformError({
        code: "PROVIDER_NOT_FOUND",
        message: `Provider ${providerId} is not registered.`,
        retryable: false,
        provider: providerId,
      });
    }
    return registration.capabilities;
  }

  isRegistered(providerId: AtsProviderId): boolean {
    return this.providers.has(providerId);
  }
}
