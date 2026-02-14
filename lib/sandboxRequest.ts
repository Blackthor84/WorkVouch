/**
 * Gate demo/sandbox data visibility. Production must NEVER see demo rows.
 * Use isSandboxRequest() before returning or querying demo orgs / sandbox-only data.
 * Data filter only — does not change API success/failure.
 */

import { isSandbox, getAppModeFromHeaders } from "@/lib/app-mode";

/**
 * Returns true when the current context is sandbox (env or request header).
 * Use to filter which data to return (e.g. exclude demo orgs in production).
 * When false: production queries must NEVER include demo/sandbox rows.
 */
export function isSandboxRequest(input?: Headers | Request | null): boolean {
  if (isSandbox()) return true;
  if (!input) return false;
  const headers = input instanceof Request ? input.headers : input;
  return getAppModeFromHeaders(headers) === "sandbox";
}
