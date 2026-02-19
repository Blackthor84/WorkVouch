/**
 * Environment detection — single source of truth for app environment.
 * Use NEXT_PUBLIC_APP_ENV (or NEXT_PUBLIC_APP_MODE / ENV for backward compatibility).
 */

const raw =
  typeof process !== "undefined"
    ? (process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NEXT_PUBLIC_APP_MODE ?? process.env.ENV)
    : undefined;

/** Resolved environment: 'production' | 'sandbox' (SANDBOX from ENV treated as sandbox). */
export const ENV: "production" | "sandbox" =
  raw === "sandbox" || raw === "SANDBOX" ? "sandbox" : "production";

export const isProd = ENV === "production";
export const isSandbox = ENV === "sandbox";
