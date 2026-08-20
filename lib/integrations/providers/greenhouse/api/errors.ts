import { IntegrationPlatformError } from "../../../utils/errors";
import type { HttpResponse } from "../types";

export function normalizeHarvestError(
  response: HttpResponse,
  path: string
): IntegrationPlatformError {
  let message = `Greenhouse Harvest API error (${response.status}) on ${path}`;
  try {
    const parsed = JSON.parse(response.body) as { message?: string; error?: string };
    message = parsed.message ?? parsed.error ?? message;
  } catch {
    // keep default message
  }

  if (response.status === 401 || response.status === 403) {
    return new IntegrationPlatformError({
      code: "SYNC_PROVIDER_AUTH_ERROR",
      message,
      retryable: true,
      provider: "greenhouse",
    });
  }

  if (response.status === 429) {
    const retryAfterHeader = response.headers["retry-after"];
    const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 10_000;
    return new IntegrationPlatformError({
      code: "SYNC_PROVIDER_RATE_LIMIT",
      message,
      retryable: true,
      retryAfterMs: Number.isFinite(retryAfterMs) ? retryAfterMs : 10_000,
      provider: "greenhouse",
    });
  }

  if (response.status >= 500) {
    return new IntegrationPlatformError({
      code: "SYNC_PROVIDER_SERVER_ERROR",
      message,
      retryable: true,
      provider: "greenhouse",
    });
  }

  if (response.status === 404) {
    return new IntegrationPlatformError({
      code: "CANDIDATE_NOT_FOUND",
      message,
      retryable: false,
      provider: "greenhouse",
    });
  }

  return new IntegrationPlatformError({
    code: "PROVIDER_SERVER_ERROR",
    message,
    retryable: false,
    provider: "greenhouse",
  });
}

export function parseRetryAfterMs(response: HttpResponse): number | undefined {
  const header = response.headers["retry-after"];
  if (!header) return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) ? seconds * 1000 : undefined;
}
