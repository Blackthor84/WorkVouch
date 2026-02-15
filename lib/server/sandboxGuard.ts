/**
 * Sandbox API guard: ENV === SANDBOX + ADMIN role only.
 * Use at the start of every /api/sandbox/* route. Auth cookies must be sent (credentials: "include").
 */

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/getAdminSession";

export type SandboxGuardResult =
  | { allowed: true }
  | { allowed: false; response: NextResponse };

export async function sandboxAdminGuard(): Promise<SandboxGuardResult> {
  if (process.env.ENV !== "SANDBOX") {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Sandbox disabled in this environment" },
        { status: 403 }
      ),
    };
  }

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
