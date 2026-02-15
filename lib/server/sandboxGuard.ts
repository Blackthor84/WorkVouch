/**
 * Sandbox API guard: ADMIN role only. Sandbox is a permissioned mode, not a deployment.
 * Use at the start of every /api/sandbox/* route. Auth cookies must be sent (credentials: "include").
 * Isolation is via data flags (is_sandbox = true), not ENV.
 */

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/getAdminSession";

export type SandboxGuardResult =
  | { allowed: true }
  | { allowed: false; response: NextResponse };

export async function sandboxAdminGuard(): Promise<SandboxGuardResult> {
  const session = await getAdminSession();

  // ADMIN is the real gate
  if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  // Sandbox is a MODE, not an ENV
  return { allowed: true };
}
