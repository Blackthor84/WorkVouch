/**
 * SINGLE SOURCE OF TRUTH — Admin context. Server-side only.
 * Uses getUser() for auth and profiles.role from DB for authorization.
 * Never use getSession() or trust cookies for role. Never throws.
 */

import { supabaseServer } from "@/lib/supabase/server";
import { normalizeRole } from "@/lib/auth/normalizeRole";
import { isAdminRole } from "@/lib/auth/roles";
import { isSandbox } from "@/lib/app-mode";

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

const UNAUTHORIZED_CONTEXT: AdminContext = {
  isAuthenticated: false,
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
 * Server-side only. Auth via getUser(); role from profiles table.
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

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !profile) {
      return {
        ...UNAUTHORIZED_CONTEXT,
        isAuthenticated: true,
        userId: user.id,
        email: user.email ?? "",
      };
    }

    const rawRole = (profile as { role?: string | null })?.role ?? "";
    const role = normalizeRole(rawRole);
    const isAdmin = isAdminRole(role);
    const isSuperAdmin = role === "super_admin";

    const roles: AdminRole[] = isAdmin ? (isSuperAdmin ? ["user", "admin", "super_admin"] : ["user", "admin"]) : ["user"];
    const sandbox = isSandbox();

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
