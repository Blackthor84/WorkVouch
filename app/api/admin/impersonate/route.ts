import { getSupabaseServer } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { writeGodModeAudit } from "@/lib/godModeAudit";
import { isSandboxEnv } from "@/lib/sandbox/env";

export const runtime = "nodejs";
import { SignJWT } from "jose";
import { writeImpersonationAudit } from "@/lib/impersonationAudit";
import type { Database } from "@/types/supabase";

const IMPERSONATION_COOKIE = "workvouch_impersonation";
const COOKIE_MAX_AGE = 30 * 60; // 30 minutes

type Profile = {
  id: string;
  email: string | null;
};

type AdminSessionInsert = Database["public"]["Tables"]["admin_sessions"]["Insert"];
type AdminActionInsert = Database["public"]["Tables"]["admin_actions"]["Insert"];

/** POST /api/admin/impersonate — superadmin only. Body: { userId }. Returns impersonateUser + impersonationToken for /api/admin/impersonate/set. */
export async function POST(request: Request) {
  try {
    const forbidden = await requireSuperadmin();
    if (forbidden) return forbidden;

    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const godModeEnabled = process.env.WORKVOUCH_GOD_MODE === "true";

    const body = await request.json();
    const userId = typeof body?.userId === "string" ? body.userId.trim() : null;
    if (!userId) {
      return NextResponse.json(
        { error: "Missing or invalid userId" },
        { status: 400 }
      );
    }

    const adminSupabase = getSupabaseServer();

    const { data: targetProfile, error } = await adminSupabase
      .from("profiles")
      .select("id, email, role")
      .eq("id", userId)
      .single<Profile & { role?: string }>();

    if (error || !targetProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const targetRole = (targetProfile as { role?: string }).role ?? "";
    const targetRoles = targetRole ? [targetRole] : [];

    if (targetRoles.includes("superadmin") && !godModeEnabled) {
      return NextResponse.json(
        { error: "Cannot impersonate another superadmin" },
        { status: 403 }
      );
    }

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

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
    let impersonationToken: string | null = null;

    try {
      const { data: adminSession, error: sessionErr } = await adminSupabase
        .from("admin_sessions")
        .insert({
          admin_id: user.id,
          impersonated_user_id: userId,
          expires_at: expiresAt.toISOString(),
        })
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
      // admin_sessions may not exist; continue without token
    }

    try {
      const adminAction: AdminActionInsert = {
        admin_id: user.id,
        impersonated_user_id: userId,
        action_type: "impersonate",
      };
      await adminSupabase.from("admin_actions").insert(adminAction);
    } catch {
      // Table may not exist; ignore
    }

    const environment = isSandboxEnv ? "sandbox" : "production";
    try {
      await writeImpersonationAudit({
        admin_user_id: user.id,
        admin_email: user.email ?? null,
        target_user_id: userId,
        target_identifier: targetProfile.email ?? null,
        event: "start",
        environment,
      });
    } catch (e) {
      console.error("[impersonate] impersonation_audit insert failed", e);
    }
    if (godModeEnabled) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;
      const userAgent = request.headers.get("user-agent") || null;
      await writeGodModeAudit({
        superadmin_id: user.id,
        superadmin_email: user.email ?? null,
        action: "impersonate",
        target_user_id: userId,
        target_identifier: targetProfile.email ?? null,
        reason: "godmode",
        environment,
        ip_address: ip,
        user_agent: userAgent,
      });
    }

    const res = NextResponse.json({
      impersonateUser,
      ...(impersonationToken && { impersonationToken, expiresAt: expiresAt.toISOString() }),
    });

    if (impersonationToken) {
      res.cookies.set(IMPERSONATION_COOKIE, impersonationToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
        path: "/",
      });
    }

    return res;
  } catch (error: unknown) {
    console.error("Impersonate API error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
