import type { ProviderRegistration } from "../types/provider";
import type { ProviderRegistry } from "./ProviderRegistry";
import { createMockAtsRegistration } from "../providers/mock/MockAtsProvider";
import { createGreenhouseRegistration } from "../providers/greenhouse/provider";

/**
 * Loads built-in provider registrations into the registry.
 * Provider-specific implementations self-register via registration objects.
 */
export class ProviderLoader {
  constructor(private readonly registry: ProviderRegistry) {}

  loadBuiltInProviders(): void {
    const registrations: ProviderRegistration[] = [
      createMockAtsRegistration(),
      createGreenhouseRegistration(),
    ];

    for (const registration of registrations) {
      if (!this.registry.isRegistered(registration.providerId)) {
        this.registry.registerProvider(registration);
      }
    }
  }

  registerExternalProvider(registration: ProviderRegistration): void {
    this.registry.registerProvider(registration);
  }
}
