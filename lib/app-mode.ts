/**
 * Global app mode / environment: production vs sandbox.
 * Same schema, same business logic, same permissions. Only difference: data separation by environment column.
 * - All queries MUST filter by .eq('environment', getEnvironment(...)) so sandbox never sees production data.
 * - If a feature works in production, it must work in sandbox. No mock-only logic.
 */

export type AppMode = "production" | "sandbox";

/** Alias for DB enum app_environment_enum. Use when filtering tables with environment column. */
export type Environment = AppMode;

/**
 * Client-side: read environment from URL search params or cookie.
 * Use in client components and after navigation.
 */
export function getAppMode(): AppMode {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sandbox") === "true") return "sandbox";
    if (params.get("environment") === "sandbox") return "sandbox";
    if (params.get("environment") === "production") return "production";
  }
  return "production";
}

/**
 * Server-side: read environment from request headers (set by middleware from URL or cookie).
 * Use in server components and API routes. Every workforce/org/location query must filter by this.
 */
export function getAppModeFromHeaders(headers: Headers): AppMode {
  const env = headers.get("x-app-environment");
  if (env === "sandbox" || env === "production") return env;
  if (headers.get("x-sandbox-mode") === "true") return "sandbox";
  return "production";
}

/**
 * Server-side: read environment from cookie, then headers, then URL (so first request with ?sandbox=true works).
 * Use in server components: getEnvironmentForServer(await headers(), await cookies(), searchParams).
 * Use in API routes: getEnvironmentForServer(request.headers, undefined, request.url).
 */
export function getEnvironmentForServer(
  headers: Headers,
  cookieStore?: { get: (name: string) => { value: string } | undefined },
  urlOrSearchParams?: string | URLSearchParams
): Environment {
  const fromCookie = cookieStore?.get("app_environment")?.value;
  if (fromCookie === "sandbox" || fromCookie === "production") return fromCookie;
  if (getAppModeFromHeaders(headers) === "sandbox") return "sandbox";
  if (urlOrSearchParams) {
    const params = typeof urlOrSearchParams === "string"
      ? new URL(urlOrSearchParams).searchParams
      : urlOrSearchParams;
    if (params.get("sandbox") === "true" || params.get("environment") === "sandbox") return "sandbox";
  }
  return "production";
}

/**
 * Same as getAppModeFromHeaders. Use when you need the value for DB .eq('environment', ...).
 */
export function getEnvironmentFromHeaders(headers: Headers): Environment {
  return getAppModeFromHeaders(headers);
}

export function getSandboxIdFromHeaders(headers: Headers): string | null {
  const id = headers.get("x-sandbox-id");
  return id && id.trim() ? id.trim() : null;
}
