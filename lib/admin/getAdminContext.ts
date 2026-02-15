/**
 * SINGLE SOURCE OF TRUTH — Admin context. Server-side only.
 * Role: Supabase Auth auth.users.raw_app_meta_data.role first, then profiles.role fallback.
 * Never use getSession() or trust cookies for role. Never throws.
 */

import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/auth/normalizeRole";
import { isAdminRole } from "@/lib/auth/roles";
import { isSandbox } from "@/lib/app-mode";
import { getRoleFromSession } from "@/lib/auth/admin-role-guards";
import { getAdminSandboxModeFromCookies } from "@/lib/sandbox/sandboxContext";
import { isSandboxEnv } from "@/lib/sandbox/env";

export type AdminRole = "user" | "admin" | "super_admin";

export type AdminContext = {
  isAuthenticated: boolean;
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

function resolveSandbox(): boolean {
  return isSandbox() || isSandboxEnv();
}

const UNAUTHORIZED_CONTEXT: AdminContext = {
  isAuthenticated: false,
  userId: "",
  email: "",
  roles: ["user"],
  isAdmin: false,
  isSuperAdmin: false,
  isSandbox: resolveSandbox(),
  canImpersonate: false,
  canBypassLimits: false,
  canSeedData: resolveSandbox(),
};

/**
 * Returns the single authoritative admin context. Never throws.
 * Role: auth.app_metadata.role first (Supabase Auth as source of truth), then profiles.role fallback.
 */
export async function getAdminContext(): Promise<AdminContext> {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || !user?.email) {
      return { ...UNAUTHORIZED_CONTEXT };
    }

    const appRole = (user as { app_metadata?: { role?: string } }).app_metadata?.role;
    const sessionLike = { user: { id: user.id, app_metadata: { role: appRole } } };
    const authRole = getRoleFromSession(sessionLike);

    let role: string;
    if (authRole !== "user") {
      role = authRole === "superadmin" ? "super_admin" : "admin";
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      const rawRole = (profile as { role?: string | null })?.role ?? "";
      role = normalizeRole(rawRole);
    }

    const isAdmin = isAdminRole(role);
    const isSuperAdmin = role === "super_admin";

    const roles: AdminRole[] = isAdmin ? (isSuperAdmin ? ["user", "admin", "super_admin"] : ["user", "admin"]) : ["user"];
    const appSandbox = resolveSandbox();
    const adminToggledSandbox = await getAdminSandboxModeFromCookies();
    const sandbox = appSandbox || adminToggledSandbox;

    return {
      isAuthenticated: true,
      userId: user.id,
      email: user.email ?? "",
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

/** Clean 403 response for admin routes. Use when !admin.isAdmin. Never leak details. */
export function adminForbiddenResponse() {
  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { "Content-Type": "application/json" },
  });
}

/** Type guard: context has admin access. */
export function hasAdminAccess(ctx: AdminContext): ctx is AdminContext & { isAdmin: true } {
  return ctx.isAdmin === true;
}
