import type { AtsProviderId, IntegrationErrorDetails } from "../types";

export class IntegrationPlatformError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly retryAfterMs?: number;
  readonly provider?: AtsProviderId;

  constructor(details: IntegrationErrorDetails) {
    super(details.message);
    this.name = "IntegrationPlatformError";
    this.code = details.code;
    this.retryable = details.retryable;
    this.retryAfterMs = details.retryAfterMs;
    this.provider = details.provider;
  }

  toJSON(): IntegrationErrorDetails {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      retryAfterMs: this.retryAfterMs,
      provider: this.provider,
    };
  }
}

/** Thrown when a provider method is defined but not yet implemented for the current sprint. */
export class NotImplementedYetError extends Error {
  readonly provider: AtsProviderId;
  readonly method: string;

  constructor(provider: AtsProviderId, method: string) {
    super(`${provider}.${method} is not implemented yet.`);
    this.name = "NotImplementedYetError";
    this.provider = provider;
    this.method = method;
  }
}

export function isIntegrationPlatformError(
  error: unknown
): error is IntegrationPlatformError {
  return error instanceof IntegrationPlatformError;
}

export function isNotImplementedYetError(
  error: unknown
): error is NotImplementedYetError {
  return error instanceof NotImplementedYetError;
}
