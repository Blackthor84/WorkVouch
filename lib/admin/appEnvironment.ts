/**
 * Admin safety: app environment for production vs sandbox.
 * ENVIRONMENT-BASED ONLY — no role or cookie override.
 * Production = read-only admin (metrics, revenue, counts). Sandbox = full power (playground, mutations).
 */

export type AppEnvironment = "production" | "sandbox";

/**
 * Server-only. True if the app is running in sandbox environment (deployment or NEXT_PUBLIC_APP_MODE).
 * Use for: showing power tools, allowing mutations. Never use cookie/role to grant sandbox in production.
 */
export function getAppEnvironment(): AppEnvironment {
  if (typeof process === "undefined") return "production";
  if (process.env.ENV === "SANDBOX") return "sandbox";
  if (process.env.NEXT_PUBLIC_APP_MODE === "sandbox") return "sandbox";
  return "production";
}

export function isSandboxEnvironment(): boolean {
  return getAppEnvironment() === "sandbox";
}

export function isProductionEnvironment(): boolean {
  return getAppEnvironment() === "production";
}
