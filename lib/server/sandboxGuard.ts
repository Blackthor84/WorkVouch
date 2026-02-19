/**
 * Sandbox API guard: auth + admin/superadmin role only. Use at the start of every /api/sandbox/* route.
 * Same auth source as admin APIs: getAuthedUser (Supabase auth.getUser() + app_metadata.role).
 * No env flags, no cookies/headers read here.
 */

import { NextResponse } from "next/server";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { canAccessSandbox } from "@/lib/auth/canAccessSandbox";

export type SandboxGuardResult =
  | { allowed: true }
  | { allowed: false; response: NextResponse };

export async function sandboxAdminGuard(): Promise<SandboxGuardResult> {
  const authed = await getAuthedUser();
  if (!authed || !canAccessSandbox(authed.role)) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Sandbox access denied" },
        { status: 403 }
      ),
    };
  }
  return { allowed: true };
}
