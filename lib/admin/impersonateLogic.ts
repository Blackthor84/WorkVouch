/**
 * Shared logic for admin impersonation (JWT + session).
 * Used by POST /api/admin/impersonate and by sandbox impersonation when target is in profiles.
 */

import { SignJWT } from "jose";
import { getSupabaseServer } from "@/lib/supabase/admin";
import type { Database } from "@/types/supabase";

type AdminSessionInsert = Database["public"]["Tables"]["admin_sessions"]["Insert"];
type AdminActionInsert = Database["public"]["Tables"]["admin_actions"]["Insert"];

type TargetProfile = { id: string; email: string | null; role?: string };

export type CreateImpersonationResult = {
  impersonateUser: { id: string; email: string; role: string; roles: string[] };
  impersonationToken: string | null;
  expiresAt: Date;
};

/**
 * Create admin session + JWT for impersonating targetProfile. Caller must have validated admin/superadmin and target is allowed.
 */
export async function createImpersonationSession(
  adminUserId: string,
  targetProfile: TargetProfile,
  adminEmail?: string | null
): Promise<CreateImpersonationResult> {
  const userId = targetProfile.id;
  const targetRole = (targetProfile.role ?? "").trim();
  const targetRoles = targetRole ? [targetRole] : [];
  const isTargetAdmin = targetRoles.includes("admin") || targetRoles.includes("superadmin");
  const isTargetBeta = targetRoles.includes("beta");
  const isTargetEmployer = targetRoles.includes("employer");
  const impersonatedRole = isTargetBeta
    ? "beta"
    : isTargetAdmin
      ? "admin"
      : isTargetEmployer
        ? "employer"
        : "user";

  const impersonateUser = {
    id: targetProfile.id,
    email: targetProfile.email ?? "",
    role: impersonatedRole,
    roles: targetRoles,
  };

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  let impersonationToken: string | null = null;
  const adminSupabase = getSupabaseServer();

  try {
    const { data: adminSession, error: sessionErr } = await adminSupabase
      .from("admin_sessions")
      .insert({
        admin_id: adminUserId,
        impersonated_user_id: userId,
        expires_at: expiresAt.toISOString(),
      } as AdminSessionInsert)
      .select("id")
      .single();

    if (!sessionErr && adminSession?.id) {
      const secret = new TextEncoder().encode(
        process.env.NEXTAUTH_SECRET || process.env.IMPERSONATION_JWT_SECRET || "impersonation-secret"
      );
      impersonationToken = await new SignJWT({
        sessionId: adminSession.id,
        impersonated_user_id: userId,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30m")
        .setIssuedAt()
        .sign(secret);
    }
  } catch {
    // admin_sessions may not exist
  }

  try {
    await adminSupabase.from("admin_actions").insert({
      admin_id: adminUserId,
      impersonated_user_id: userId,
      action_type: "impersonate",
    } as AdminActionInsert);
  } catch {
    // ignore
  }

  return { impersonateUser, impersonationToken, expiresAt };
}
