/**
 * Sandbox API guard: auth + admin/superadmin role only. Use at the start of every /api/sandbox/* route.
 * Allows current session admin/superadmin OR impersonated admin (adminUserId cookie).
 * Logs [SANDBOX ROLE] for audit. Does not block impersonated admins.
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { canAccessSandbox } from "@/lib/auth/canAccessSandbox";
import { getSupabaseServer } from "@/lib/supabase/admin";

const ADMIN_USER_ID_COOKIE = "adminUserId";

export type SandboxGuardResult =
  | { allowed: true; role: string }
  | { allowed: false; response: NextResponse };

export async function sandboxAdminGuard(): Promise<SandboxGuardResult> {
  const authed = await getAuthedUser();
  if (authed && canAccessSandbox(authed.role)) {
    console.log("[SANDBOX ROLE]", authed.role);
    return { allowed: true, role: authed.role };
  }

  const cookieStore = await cookies();
  const adminUserId = cookieStore.get(ADMIN_USER_ID_COOKIE)?.value?.trim();
  if (adminUserId) {
    try {
      const supabase = getSupabaseServer();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", adminUserId)
        .maybeSingle();
      const role = (profile as { role?: string } | null)?.role ?? "";
      const normalized = String(role).toLowerCase().trim();
      if (normalized === "admin" || normalized === "superadmin" || normalized === "super_admin") {
        console.log("[SANDBOX ROLE]", normalized + " (impersonating)");
        return { allowed: true, role: normalized };
      }
    } catch {
      // fall through to deny
    }
  }

  return {
    allowed: false,
    response: NextResponse.json(
      { error: "Sandbox access denied" },
      { status: 403 }
    ),
  };
}
