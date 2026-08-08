/** @type {import('./env.mjs').Env} */
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PK || '',
  NEXT_PUBLIC_STRIPE_PK: process.env.NEXT_PUBLIC_STRIPE_PK || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER || '',
  STRIPE_PRICE_TEAM: process.env.STRIPE_PRICE_TEAM || '',
  STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO || '',
  STRIPE_PRICE_SECURITY: process.env.STRIPE_PRICE_SECURITY || '',
  STRIPE_PRICE_ONE_TIME: process.env.STRIPE_PRICE_ONE_TIME || '',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL || '',
  // WorkVouch Connect
  ATS_ENABLED: process.env.ATS_ENABLED || '',
  GREENHOUSE_ENABLED: process.env.GREENHOUSE_ENABLED || '',
  ATS_ENCRYPTION_KEY: process.env.ATS_ENCRYPTION_KEY || '',
  PANEL_JWT_SECRET: process.env.PANEL_JWT_SECRET || '',
  CRON_SECRET: process.env.CRON_SECRET || '',
  GREENHOUSE_CLIENT_ID: process.env.GREENHOUSE_CLIENT_ID || '',
  GREENHOUSE_CLIENT_SECRET: process.env.GREENHOUSE_CLIENT_SECRET || '',
  GREENHOUSE_WEBHOOK_SECRET: process.env.GREENHOUSE_WEBHOOK_SECRET || '',
  GREENHOUSE_REDIRECT_URI: process.env.GREENHOUSE_REDIRECT_URI || '',
  CONNECT_DEMO_MODE_ENABLED: process.env.CONNECT_DEMO_MODE_ENABLED || '',
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || '',
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  REDIS_URL: process.env.REDIS_URL || '',
  RATE_LIMIT_STORE: process.env.RATE_LIMIT_STORE || '',
  SENTRY_DSN: process.env.SENTRY_DSN || '',
};

const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

function envBool(name) {
  const raw = process.env[name];
  if (raw === undefined) return false;
  return TRUTHY.has(String(raw).trim().toLowerCase());
}

const CONNECT_REQUIRED = [
  'ATS_ENCRYPTION_KEY',
  'PANEL_JWT_SECRET',
  'CRON_SECRET',
  'GREENHOUSE_CLIENT_ID',
  'GREENHOUSE_CLIENT_SECRET',
  'GREENHOUSE_WEBHOOK_SECRET',
];

/** Build-time Connect env validation — throws on missing production secrets. */
export function validateConnectEnvAtBuild() {
  if (process.env.NODE_ENV !== 'production') return;
  if (!envBool('ATS_ENABLED') || !envBool('GREENHOUSE_ENABLED')) return;

  const missing = CONNECT_REQUIRED.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `WorkVouch Connect build failed — missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}`
    );
  }

  const rateStore = process.env.RATE_LIMIT_STORE || 'upstash';
  if (rateStore !== 'memory') {
    const hasUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
    const hasRedis = process.env.REDIS_URL;
    if (!hasUpstash && !hasRedis) {
      throw new Error(
        'WorkVouch Connect build failed — UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN or REDIS_URL required for production rate limiting'
      );
    }
  }
}
