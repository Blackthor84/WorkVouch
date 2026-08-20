import type { IntegrationLogEntry } from "../types/logging";

const SENSITIVE_KEY = /secret|token|password|authorization|bearer|api[_-]?key|jwt|credential/i;

function redactValue(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    if (value.length > 80 && /^[A-Za-z0-9+/=_-]+$/.test(value)) return "[REDACTED]";
    return value.replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]");
  }
  if (Array.isArray(value)) return value.map(redactValue);
  if (typeof value === "object") return redactMetadata(value as Record<string, unknown>);
  return value;
}

function redactMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    out[key] = SENSITIVE_KEY.test(key) ? "[REDACTED]" : redactValue(value);
  }
  return out;
}

function shouldForward(level: IntegrationLogEntry["level"]): boolean {
  return level === "error" || level === "warn";
}

/** Forwards Connect errors/warnings to Sentry when SENTRY_DSN is set. */
export function createSentryLogSink(): ((entry: IntegrationLogEntry) => void) | undefined {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return undefined;

  let sentry: typeof import("@sentry/node") | null = null;

  return (entry: IntegrationLogEntry) => {
    if (!shouldForward(entry.level)) return;

    void (async () => {
      try {
        if (!sentry) {
          sentry = await import("@sentry/node");
          if (!sentry.isInitialized()) {
            sentry.init({
              dsn,
              environment: process.env.NODE_ENV ?? "development",
              tracesSampleRate: 0.05,
            });
          }
        }

        const metadata = entry.metadata ? redactMetadata(entry.metadata) : undefined;
        const tags = {
          provider: entry.provider,
          correlationId: entry.correlationId,
          connectionId: metadata?.connectionId ? String(metadata.connectionId) : undefined,
        };

        if (entry.level === "error") {
          sentry.captureMessage(entry.event, {
            level: "error",
            tags,
            extra: { ...metadata, companyId: entry.companyId, result: entry.result },
          });
        } else {
          sentry.captureMessage(entry.event, {
            level: "warning",
            tags,
            extra: { ...metadata, companyId: entry.companyId },
          });
        }
      } catch {
        // never throw from log sink
      }
    })();
  };
}

export { redactMetadata };
