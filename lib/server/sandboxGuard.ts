/**
 * Sandbox API guard: environment + ADMIN role. Mutations only in sandbox environment.
 * Use at the start of every /api/sandbox/* and playground mutation route.
 */

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/getAdminSession";
import { requireSandboxOrOverrideEnvironment } from "@/lib/server/requireSandboxOrOverride";

export type SandboxGuardResult =
  | { allowed: true }
  | { allowed: false; response: NextResponse };

export async function sandboxAdminGuard(): Promise<SandboxGuardResult> {
  const envCheck = await requireSandboxOrOverrideEnvironment();
  if (!envCheck.allowed) return envCheck;

  const session = await getAdminSession();
  if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { allowed: true };
}
