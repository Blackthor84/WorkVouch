import { NextResponse } from "next/server";
import { FeatureFlagService } from "@/lib/integrations/config/ConfigurationService";
import { withRateLimit } from "@/lib/rateLimit";

export function isConnectProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Demo panel/API only when not production or explicitly enabled for marketplace review. */
export function isConnectDemoAllowed(): boolean {
  if (!isConnectProduction()) return true;
  return process.env.CONNECT_DEMO_MODE_ENABLED === "true";
}

/** Block Connect routes when ATS master flag is off. */
export function requireConnectEnabled(): NextResponse | null {
  const flags = new FeatureFlagService();
  if (!flags.isEnabled("ATS_ENABLED")) {
    return NextResponse.json({ error: "WorkVouch Connect is disabled" }, { status: 503 });
  }
  if (!flags.isEnabled("GREENHOUSE_ENABLED")) {
    return NextResponse.json({ error: "Greenhouse integration is disabled" }, { status: 503 });
  }
  return null;
}

/** Internal/cron routes — requires CRON_SECRET bearer token. */
export function requireCronSecret(request: Request): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Cron secret not configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Standard rate limit for integration ingress routes. */
export async function rateLimitIntegrationRoute(
  request: Request,
  prefix: string,
  maxPerWindow = 60
): Promise<NextResponse | null> {
  const result = await withRateLimit(request, { prefix, maxPerWindow });
  if (!result.allowed) return result.response;
  return null;
}

/** Validates production secrets are configured (call at route startup or health). */
export function validateConnectProductionSecrets(): string[] {
  if (!isConnectProduction()) return [];

  const missing: string[] = [];
  if (!process.env.ATS_ENCRYPTION_KEY) missing.push("ATS_ENCRYPTION_KEY");
  if (!process.env.PANEL_JWT_SECRET) missing.push("PANEL_JWT_SECRET");
  if (!process.env.GREENHOUSE_CLIENT_ID) missing.push("GREENHOUSE_CLIENT_ID");
  if (!process.env.GREENHOUSE_CLIENT_SECRET) missing.push("GREENHOUSE_CLIENT_SECRET");
  if (!process.env.GREENHOUSE_WEBHOOK_SECRET) missing.push("GREENHOUSE_WEBHOOK_SECRET");
  if (!process.env.CRON_SECRET) missing.push("CRON_SECRET");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  return missing;
}

/** Returns error response if production secrets missing. */
export function requireProductionSecrets(): NextResponse | null {
  const missing = validateConnectProductionSecrets();
  if (missing.length === 0) return null;
  return NextResponse.json(
    { error: "Connect production secrets not configured", missing },
    { status: 503 }
  );
}
