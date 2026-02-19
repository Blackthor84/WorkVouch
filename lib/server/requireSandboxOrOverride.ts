/**
 * Mutation guard: allow sandbox environment OR production when founder override is active.
 * Use at the start of mutation API routes instead of requireSandboxEnvironment when override is supported.
 */

import { NextResponse } from "next/server";
import { getAppEnvironment } from "@/lib/admin/appEnvironment";
import { getAdminOverrideStatus } from "@/lib/admin/overrideStatus";

const MUTATIONS_DISABLED_RESPONSE = NextResponse.json(
  { error: "Mutations disabled in production" },
  { status: 403 }
);

export type SandboxOrOverrideResult =
  | { allowed: true; overrideActive?: boolean }
  | { allowed: false; response: NextResponse };

/**
 * Returns allowed when: app is sandbox OR (app is production AND admin override is active and not expired).
 * Otherwise returns 403. Never rely on frontend-only checks.
 */
export async function requireSandboxOrOverrideEnvironment(): Promise<SandboxOrOverrideResult> {
  if (getAppEnvironment() === "sandbox") {
    return { allowed: true, overrideActive: false };
  }
  const status = await getAdminOverrideStatus();
  if (status.active) {
    return { allowed: true, overrideActive: true };
  }
  return { allowed: false, response: MUTATIONS_DISABLED_RESPONSE };
}
