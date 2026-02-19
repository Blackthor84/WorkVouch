/**
 * Admin safety: app environment for production vs sandbox.
 * Single source: lib/env/env (ENV, isProd, isSandbox from NEXT_PUBLIC_APP_ENV).
 */

import { ENV } from "@/lib/env/env";

export type AppEnvironment = "production" | "sandbox";

/** Same as ENV from @/lib/env/env. Use for server-side admin context. */
export function getAppEnvironment(): AppEnvironment {
  return ENV;
}

export function isSandboxEnvironment(): boolean {
  return ENV === "sandbox";
}

export function isProductionEnvironment(): boolean {
  return ENV === "production";
}
