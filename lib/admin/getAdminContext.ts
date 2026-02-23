/**
 * SINGLE SOURCE OF TRUTH — Admin context. Server-side only.
 * Role: session.user.app_metadata.role only (user, admin, superadmin). Do NOT use profiles.role for auth.
 * Never use getSession() or trust cookies for role. Never throws.
 * API routes MUST call getAdminContext(req) and pass the request.
 */

import { type NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { isSandbox } from "@/lib/app-mode";
import { getRoleFromSession } from "@/lib/auth/admin-role-guards";
import { isAdminRole } from "@/lib/auth/isAdminRole";
import { getAdminSandboxModeFromCookies } from "@/lib/sandbox/sandboxContext";
import { isSandboxEnv } from "@/lib/sandbox/env";
import { getGodModeState } from "@/lib/auth/godModeCookie";
import { getAppEnvironment, type AppEnvironment } from "@/lib/admin/appEnvironment";
import { getEffectiveSession } from "@/lib/auth/actingUser";
import type { ImpersonationContext } from "@/types/impersonation";
import {
  IMPERSONATION_SIMULATION_COOKIE,
  parseSimulationContextFromCookie,
} from "@/lib/impersonation-simulation/context";
import { cookies } from "next/headers";

export type AdminRole = "user" | "admin" | "super_admin";

export type GodModeState = { enabled: boolean; enabledAt?: string };

export type AdminContext = {
  isAuthenticated: boolean;
  /** Effective user id (acting_user?.id ?? auth_user.id). Use for "who we're acting as". */
  userId: string;
  /** Auth user id (real logged-in user). Use for audit / god mode. */
  authUserId: string;
  email: string;
  roles: AdminRole[];
  /** effectiveRole = acting_user?.role ?? auth_user.role. Drives route guards and redirects. */
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
  impersonation: ImpersonationContext;
};

function resolveSandbox(): boolean {
  return isSandbox() || isSandboxEnv;
}

const UNAUTHORIZED_CONTEXT: AdminContext = {
  isAuthenticated: false,
  userId: "",
  authUserId: "",
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
 * effectiveRole = acting_user?.role ?? auth_user.role — all route guards use this (admin blocked when acting as non-admin).
 */
export async function getAdminContext(req?: NextRequest): Promise<AdminContext> {
  if (process.env.NODE_ENV !== "production" && req == null) {
    console.warn("getAdminContext called without request; API routes must pass req.");
  }
  try {
    const effectiveSession = await getEffectiveSession();
    if (!effectiveSession) {
      return { ...UNAUTHORIZED_CONTEXT };
    }

    const { authUserId, authRole, effectiveUserId, effectiveRole } = effectiveSession;
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id || !user?.email) {
      return { ...UNAUTHORIZED_CONTEXT };
    }

    const profileRole = effectiveRole === "superadmin" || effectiveRole === "super_admin" ? "super_admin" : effectiveRole === "admin" ? "admin" : "user";
    const isAdmin = isAdminRole(effectiveRole);
    const isSuperAdmin = effectiveRole === "superadmin" || effectiveRole === "super_admin";
    const authIsSuperAdmin = authRole === "superadmin";

    const roles: AdminRole[] = isAdmin ? (isSuperAdmin ? ["user", "admin", "super_admin"] : ["user", "admin"]) : ["user"];
    const appEnvironment = getAppEnvironment();
    const appSandbox = resolveSandbox();
    const adminToggledSandbox = await getAdminSandboxModeFromCookies();
    const sandbox = appSandbox || adminToggledSandbox;
    const godMode = await getGodModeState(authUserId, authIsSuperAdmin);
    const impersonation = await resolveAdminImpersonationContext(effectiveSession.isImpersonating);

    return {
      isAuthenticated: true,
      userId: effectiveUserId,
      authUserId,
      email: user.email ?? "",
      roles,
      profileRole,
      isAdmin,
      isSuperAdmin,
      appEnvironment,
      isSandbox: sandbox,
      canImpersonate: authIsSuperAdmin || sandbox,
      canBypassLimits: authIsSuperAdmin || sandbox,
      canSeedData: appEnvironment === "sandbox" ? (sandbox || authIsSuperAdmin) : false,
      godMode,
      impersonation,
    };
  } catch {
    return { ...UNAUTHORIZED_CONTEXT };
  }
}

async function resolveAdminImpersonationContext(isImpersonating: boolean): Promise<ImpersonationContext> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(IMPERSONATION_SIMULATION_COOKIE)?.value;
  const sim = parseSimulationContextFromCookie(raw);
  if (sim) {
    return {
      impersonating: isImpersonating || sim.impersonating,
      actorType: sim.actorType,
      scenario: sim.scenario ?? undefined,
    };
  }
  return { impersonating: isImpersonating, actorType: "employee" };
}

/** Standard 403 for admin routes. Use when !admin.isAdmin. Never leak details. */
export function adminForbiddenResponse() {
  return NextResponse.json({ error: "Admin access required" }, { status: 403 });
}

/** Type guard: context has admin access. */
export function hasAdminAccess(ctx: AdminContext): ctx is AdminContext & { isAdmin: true } {
  return ctx.isAdmin === true;
}
