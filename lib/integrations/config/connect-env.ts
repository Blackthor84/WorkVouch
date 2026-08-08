import { z } from "zod";

const truthy = new Set(["1", "true", "yes", "on"]);

function envBool(name: string, defaultValue = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return truthy.has(raw.trim().toLowerCase());
}

/** Connect env schema — optional in dev, required when ATS_ENABLED in production. */
export const connectEnvSchema = z.object({
  ATS_ENABLED: z.string().optional(),
  GREENHOUSE_ENABLED: z.string().optional(),
  ATS_ENCRYPTION_KEY: z.string().optional(),
  PANEL_JWT_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  GREENHOUSE_CLIENT_ID: z.string().optional(),
  GREENHOUSE_CLIENT_SECRET: z.string().optional(),
  GREENHOUSE_WEBHOOK_SECRET: z.string().optional(),
  GREENHOUSE_REDIRECT_URI: z.string().optional(),
  GREENHOUSE_BASE_URL: z.string().optional(),
  CONNECT_DEMO_MODE_ENABLED: z.string().optional(),
  CONNECT_RATE_LIMIT_PER_MIN: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  REDIS_URL: z.string().optional(),
  RATE_LIMIT_STORE: z.enum(["memory", "redis", "upstash"]).optional(),
  SENTRY_DSN: z.string().optional(),
});

export type ConnectEnv = z.infer<typeof connectEnvSchema>;

export function isProductionNodeEnv(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isConnectEnabledInEnv(): boolean {
  return envBool("ATS_ENABLED") && envBool("GREENHOUSE_ENABLED");
}

/** Required Connect secrets when ATS + Greenhouse are enabled in production. */
export function getRequiredConnectSecrets(): string[] {
  return [
    "ATS_ENCRYPTION_KEY",
    "PANEL_JWT_SECRET",
    "CRON_SECRET",
    "GREENHOUSE_CLIENT_ID",
    "GREENHOUSE_CLIENT_SECRET",
    "GREENHOUSE_WEBHOOK_SECRET",
  ];
}

export function validateConnectEnv(options?: {
  production?: boolean;
  connectEnabled?: boolean;
}): { valid: boolean; errors: string[]; warnings: string[] } {
  const production = options?.production ?? isProductionNodeEnv();
  const connectEnabled = options?.connectEnabled ?? isConnectEnabledInEnv();
  const errors: string[] = [];
  const warnings: string[] = [];

  connectEnvSchema.safeParse(process.env);

  if (!connectEnabled) {
    if (production && envBool("ATS_ENABLED") && !envBool("GREENHOUSE_ENABLED")) {
      warnings.push("ATS_ENABLED=true but GREENHOUSE_ENABLED is not set");
    }
    return { valid: true, errors, warnings };
  }

  if (production) {
    for (const key of getRequiredConnectSecrets()) {
      if (!process.env[key]?.trim()) {
        errors.push(`${key} is required in production when WorkVouch Connect is enabled`);
      }
    }

    const rateStore = process.env.RATE_LIMIT_STORE ?? "upstash";
    if (rateStore !== "memory") {
      const hasUpstash =
        Boolean(process.env.UPSTASH_REDIS_REST_URL) && Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);
      const hasRedis = Boolean(process.env.REDIS_URL);
      if (!hasUpstash && !hasRedis) {
        errors.push(
          "UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN or REDIS_URL is required in production for distributed rate limiting"
        );
      }
    }

    if (!process.env.SENTRY_DSN?.trim()) {
      warnings.push("SENTRY_DSN not set — production errors will not be forwarded to Sentry");
    }
  } else {
    for (const key of getRequiredConnectSecrets()) {
      if (!process.env[key]?.trim()) {
        warnings.push(`${key} not set (dev fallback may apply)`);
      }
    }
  }

  if (envBool("CONNECT_DEMO_MODE_ENABLED") && production) {
    warnings.push("CONNECT_DEMO_MODE_ENABLED=true in production — intended for marketplace reviewer sandbox only");
  }

  return { valid: errors.length === 0, errors, warnings };
}

/** Throws with descriptive message — call at build/startup when Connect is enabled in production. */
export function assertConnectEnvReady(): void {
  const result = validateConnectEnv();
  if (result.valid) return;

  const message = [
    "WorkVouch Connect environment validation failed:",
    ...result.errors.map((e) => `  - ${e}`),
  ].join("\n");
  throw new Error(message);
}

/** Build-time validation entry point for next.config.js */
export function validateConnectEnvAtBuild(): void {
  if (!isProductionNodeEnv()) return;
  if (!isConnectEnabledInEnv()) return;
  assertConnectEnvReady();
}
