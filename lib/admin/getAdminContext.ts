/**
 * SINGLE SOURCE OF TRUTH — Admin context. Server-side only.
 * Role: session.user.app_metadata.role only (user, admin, superadmin). Do NOT use profiles.role for auth.
 * Never use getSession() or trust cookies for role. Never throws.
 * API routes MUST call getAdminContext(req) and pass the request.
 */

import { type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { isSandbox } from "@/lib/app-mode";
import { getRoleFromSession } from "@/lib/auth/admin-role-guards";
import { getAdminSandboxModeFromCookies } from "@/lib/sandbox/sandboxContext";
import { isSandboxEnv } from "@/lib/sandbox/env";
import { getGodModeState } from "@/lib/auth/godModeCookie";
import { getAppEnvironment, type AppEnvironment } from "@/lib/admin/appEnvironment";

export type AdminRole = "user" | "admin" | "super_admin";

export type GodModeState = { enabled: boolean; enabledAt?: string };

export type AdminContext = {
  isAuthenticated: boolean;
  userId: string;
  email: string;
  roles: AdminRole[];
  /** Resolved role from auth or profiles.role (e.g. admin, super_admin, finance). */
  profileRole: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** Environment-based only. Production = read-only admin; sandbox = full power (playground, mutations). */
  appEnvironment: AppEnvironment;
  /** User-facing sandbox mode (cookie + env). For display only; power tools gated by appEnvironment. */
  isSandbox: boolean;
  canImpersonate: boolean;
  canBypassLimits: boolean;
  canSeedData: boolean;
  godMode: GodModeState;
};

function resolveSandbox(): boolean {
  return isSandbox() || isSandboxEnv;
}

const UNAUTHORIZED_CONTEXT: AdminContext = {
  isAuthenticated: false,
  userId: "",
  email: "",
  roles: ["user"],
  profileRole: "user",
  isAdmin: false,
  isSuperAdmin: false,
  appEnvironment: getAppEnvironment(),
  isSandbox: resolveSandbox(),
  canImpersonate: false,
  canBypassLimits: false,
  canSeedData: resolveSandbox(),
  godMode: { enabled: false },
};

/**
 * Returns the single authoritative admin context. Never throws.
 * Role: app_metadata.role only. API routes must pass the request: getAdminContext(req).
 */
export async function getAdminContext(req?: NextRequest): Promise<AdminContext> {
  if (process.env.NODE_ENV !== "production" && req == null) {
    console.warn("getAdminContext called without request; API routes must pass req.");
  }
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
    const profileRole = authRole === "superadmin" ? "super_admin" : authRole === "admin" ? "admin" : "user";
    const isAdmin = authRole === "admin" || authRole === "superadmin";
    const isSuperAdmin = authRole === "superadmin";

    const roles: AdminRole[] = isAdmin ? (isSuperAdmin ? ["user", "admin", "super_admin"] : ["user", "admin"]) : ["user"];
    const appEnvironment = getAppEnvironment();
    const appSandbox = resolveSandbox();
    const adminToggledSandbox = await getAdminSandboxModeFromCookies();
    const sandbox = appSandbox || adminToggledSandbox;
    const godMode = await getGodModeState(user.id, isSuperAdmin);

    return {
      isAuthenticated: true,
      userId: user.id,
      email: user.email ?? "",
      roles,
      profileRole,
      isAdmin,
      isSuperAdmin,
      appEnvironment,
      isSandbox: sandbox,
      canImpersonate: isSuperAdmin || sandbox,
      canBypassLimits: isSuperAdmin || sandbox,
      canSeedData: appEnvironment === "sandbox" ? (sandbox || isSuperAdmin) : false,
      godMode,
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
