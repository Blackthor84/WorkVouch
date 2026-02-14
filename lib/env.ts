/**
 * Central env access. Safe at import (no throw).
 * SINGLE EXECUTION PATH: APP_MODE may ONLY affect seed data, limits, logging, admin visibility.
 * It must NOT change business logic or success/failure.
 */

function getEnv(key: string): string | undefined {
  if (typeof process === "undefined") return undefined;
  return process.env[key];
}

export type AppMode = "production" | "sandbox";

/** Single environment contract. Only source: NEXT_PUBLIC_APP_MODE. */
export const APP_MODE: AppMode =
  typeof process !== "undefined" && getEnv("NEXT_PUBLIC_APP_MODE") === "sandbox"
    ? "sandbox"
    : "production";

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

/** @deprecated Use APP_MODE === "sandbox". Kept for compatibility. */
export const IS_SANDBOX = APP_MODE === "sandbox";

/** @deprecated Use APP_MODE === "sandbox". Affects only seed data visibility and admin tools, never logic. */
export const SANDBOX_MODE = APP_MODE === "sandbox";
