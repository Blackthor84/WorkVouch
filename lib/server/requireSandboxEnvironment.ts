/**
 * Environment-based guard for mutation APIs. No role or cookie override.
 * Production = mutations disabled. Sandbox = mutations allowed.
 */

import { NextResponse } from "next/server";
import { getAppEnvironment } from "@/lib/admin/appEnvironment";

const MUTATIONS_DISABLED_RESPONSE = NextResponse.json(
  { error: "Mutations disabled in production" },
  { status: 403 }
);

/**
 * Use at the start of any API route that performs mutations (playground, seed, reset, etc.).
 * Returns 403 when app environment is production. Never rely on frontend-only checks.
 */
export function requireSandboxEnvironment():
  | { allowed: true }
  | { allowed: false; response: NextResponse } {
  if (getAppEnvironment() !== "sandbox") {
    return { allowed: false, response: MUTATIONS_DISABLED_RESPONSE };
  }
  return { allowed: true };
}
