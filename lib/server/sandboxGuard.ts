/**
 * Sandbox API guard: environment + admin/superadmin role. Use at the start of every /api/sandbox/* route.
 * Role from getAdminContext (app_metadata) so superadmin is allowed even when profiles.role is missing.
 */

import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { canAccessSandbox } from "@/lib/auth/canAccessSandbox";
import { requireSandboxOrOverrideEnvironment } from "@/lib/server/requireSandboxOrOverride";

export type SandboxGuardResult =
  | { allowed: true }
  | { allowed: false; response: NextResponse };

export async function sandboxAdminGuard(): Promise<SandboxGuardResult> {
  const envCheck = await requireSandboxOrOverrideEnvironment();
  if (!envCheck.allowed) return envCheck;

  const admin = await getAdminContext();
  const allowed = admin.isAuthenticated && (canAccessSandbox(admin.profileRole) || admin.isAdmin || admin.isSuperAdmin);
  if (!allowed) {
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
