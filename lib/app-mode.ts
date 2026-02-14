/**
 * Single source of truth for app mode. Use this everywhere instead of process.env for mode checks.
 * Safe default: "production" when NEXT_PUBLIC_APP_MODE is undefined.
 * Works in API routes, Server Components, and Client Components.
 */

export type AppMode = "production" | "sandbox";

const raw =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_APP_MODE
    : undefined;

export const APP_MODE: AppMode =
  raw === "sandbox" ? "sandbox" : "production";

export function isSandbox(): boolean {
  return APP_MODE === "sandbox";
}

export function isProduction(): boolean {
  return APP_MODE === "production";
}

/** Server/API: read app mode from request headers (middleware may set x-app-environment). */
export function getAppModeFromHeaders(headers: Headers): AppMode {
  const env = headers.get("x-app-environment");
  if (env === "sandbox" || env === "production") return env;
  if (headers.get("x-sandbox-mode") === "true") return "sandbox";
  return "production";
}

/** Server/API: read sandbox id from request headers. */
export function getSandboxIdFromHeaders(headers: Headers): string | null {
  const id = headers.get("x-sandbox-id");
  return id?.trim() ?? null;
}

/** Client: read app mode from URL params or cookie (for client components). */
export function getAppMode(): AppMode {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sandbox") === "true") return "sandbox";
    if (params.get("environment") === "sandbox") return "sandbox";
    if (params.get("environment") === "production") return "production";
  }
  return "production";
}

/** Server: read environment from cookie, then headers, then URL (for DB filtering). */
export function getEnvironmentForServer(
  headers: Headers,
  cookieStore?: { get: (name: string) => { value: string } | undefined },
  urlOrSearchParams?: string | URLSearchParams
): AppMode {
  const fromCookie = cookieStore?.get("app_environment")?.value;
  if (fromCookie === "sandbox" || fromCookie === "production") return fromCookie;
  if (getAppModeFromHeaders(headers) === "sandbox") return "sandbox";
  if (urlOrSearchParams) {
    const params =
      typeof urlOrSearchParams === "string"
        ? new URL(urlOrSearchParams).searchParams
        : urlOrSearchParams;
    if (params.get("sandbox") === "true" || params.get("environment") === "sandbox") return "sandbox";
  }
  return "production";
}
