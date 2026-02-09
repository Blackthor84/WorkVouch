/**
 * Global app mode: production vs sandbox.
 * Sandbox mode bypasses Stripe, production auth, and writes to sandbox tables.
 */

export type AppMode = "production" | "sandbox";

/**
 * Client-side: read mode from URL search params.
 * Use in client components and after navigation.
 */
export function getAppMode(): AppMode {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sandbox") === "true") return "sandbox";
  }
  return "production";
}

/**
 * Server-side: read mode from request headers (set by middleware when URL has sandbox=true).
 * Use in server components and API routes.
 */
export function getAppModeFromHeaders(headers: Headers): AppMode {
  if (headers.get("x-sandbox-mode") === "true") return "sandbox";
  return "production";
}

export function getSandboxIdFromHeaders(headers: Headers): string | null {
  const id = headers.get("x-sandbox-id");
  return id && id.trim() ? id.trim() : null;
}
