/**
 * Central env access. Safe at import (no throw).
 * For app mode use @/lib/app-mode (APP_MODE, isSandbox, isProduction).
 */

function getEnv(key: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env[key];
}

export type Env = {
  OPENAI_API_KEY: string | undefined;
  NEXT_PUBLIC_SUPABASE_URL: string | undefined;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string | undefined;
  SUPABASE_SERVICE_ROLE_KEY: string | undefined;
  NEXT_PUBLIC_APP_MODE: string;
  NEXTAUTH_URL: string | undefined;
  NEXTAUTH_SECRET: string | undefined;
  NODE_ENV: string;
  NEXT_PUBLIC_APP_URL: string | undefined;
  NEXT_PUBLIC_URL: string | undefined;
  VERCEL_URL: string | undefined;
  CRON_SECRET: string | undefined;
  STRIPE_SECRET_KEY: string | undefined;
  STRIPE_WEBHOOK_SECRET: string | undefined;
};

export const env: Env = {
  OPENAI_API_KEY: getEnv("OPENAI_API_KEY"),
  NEXT_PUBLIC_SUPABASE_URL: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  NEXT_PUBLIC_APP_MODE: getEnv("NEXT_PUBLIC_APP_MODE") ?? "production",
  NEXTAUTH_URL: getEnv("NEXTAUTH_URL"),
  NEXTAUTH_SECRET: getEnv("NEXTAUTH_SECRET"),
  NODE_ENV: getEnv("NODE_ENV") ?? "development",
  NEXT_PUBLIC_APP_URL: getEnv("NEXT_PUBLIC_APP_URL"),
  NEXT_PUBLIC_URL: getEnv("NEXT_PUBLIC_URL"),
  VERCEL_URL: getEnv("VERCEL_URL"),
  CRON_SECRET: getEnv("CRON_SECRET"),
  STRIPE_SECRET_KEY: getEnv("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: getEnv("STRIPE_WEBHOOK_SECRET"),
};
