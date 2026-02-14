/**
 * SINGLE SOURCE OF TRUTH — Admin context. Server-side only.
 * Uses Supabase service role to derive roles from database (admin_users).
 * Never trust session.user.role alone. No duplicated role logic. Cache per request only.
 */

import { supabaseServer } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { normalizeRole } from "@/lib/auth/normalizeRole";
import { isAdminRole } from "@/lib/auth/roles";
import { isSandbox } from "@/lib/app-mode";

export type AdminRole = "user" | "admin" | "super_admin";

export type AdminContext = {
  userId: string;
  email: string;
  roles: AdminRole[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isSandbox: boolean;
  canImpersonate: boolean;
  canBypassLimits: boolean;
  canSeedData: boolean;
};

const UNAUTHORIZED_CONTEXT: AdminContext = {
  userId: "",
  email: "",
  roles: ["user"],
  isAdmin: false,
  isSuperAdmin: false,
  isSandbox: isSandbox(),
  canImpersonate: false,
  canBypassLimits: false,
  canSeedData: isSandbox(),
};

/**
 * Returns the single authoritative admin context. Never throws.
 * Server-side only. Uses service role to read admin_users.
 */
export async function getAdminContext(): Promise<AdminContext> {
  try {
    const userClient = await supabaseServer();
    const {
      data: { session },
    } = await userClient.auth.getSession();

    if (!session?.user?.id || !session?.user?.email) {
      return { ...UNAUTHORIZED_CONTEXT };
    }

    const supabase = getSupabaseServer();
    const { data: adminRow, error } = await supabase
      .from("admin_users")
      .select("role")
      .eq("email", session.user.email)
      .maybeSingle();

    if (error) {
      return {
        ...UNAUTHORIZED_CONTEXT,
        userId: session.user.id,
        email: session.user.email ?? "",
      };
    }

    const rawRole = (adminRow as { role?: string | null } | null)?.role ?? "";
    const role = normalizeRole(rawRole);
    const isAdmin = isAdminRole(role);
    const isSuperAdmin = role === "super_admin";

    const roles: AdminRole[] = isAdmin ? (isSuperAdmin ? ["user", "admin", "super_admin"] : ["user", "admin"]) : ["user"];
    const sandbox = isSandbox();

    return {
      userId: session.user.id,
      email: session.user.email ?? "",
      roles,
      isAdmin,
      isSuperAdmin,
      isSandbox: sandbox,
      canImpersonate: isSuperAdmin || sandbox,
      canBypassLimits: isSuperAdmin || sandbox,
      canSeedData: sandbox || isSuperAdmin,
    };
  } catch {
    return { ...UNAUTHORIZED_CONTEXT };
  }
}

/** Clean 403 response for admin routes. Use when !admin.isAdmin. */
export function adminForbiddenResponse() {
  return new Response(
    JSON.stringify({ error: "🚨 Upgrade Required\nEnterprise Recommended" }),
    { status: 403, headers: { "Content-Type": "application/json" } }
  );
}

/** Type guard: context has admin access. */
export function hasAdminAccess(ctx: AdminContext): ctx is AdminContext & { isAdmin: true } {
  return ctx.isAdmin === true;
}
