import { getSupabaseServer } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import type { Database } from "@/types/supabase";

type Profile = {
  id: string;
  email: string | null;
};

type AdminSessionInsert = Database["public"]["Tables"]["admin_sessions"]["Insert"];
type AdminActionInsert = Database["public"]["Tables"]["admin_actions"]["Insert"];

export async function POST(request: Request) {
  try {
    const supabase = await supabaseServer();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!profile || !["admin", "superadmin"].includes((profile as { role?: string }).role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
      .select("id, email")
      .eq("id", userId)
      .single<Profile>();

    if (error || !targetProfile) {
      return new Response("Profile not found", { status: 404 });
    }

    const { data: rolesData, error: rolesError } = await adminSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesError) {
      return NextResponse.json(
        { error: "Failed to fetch target user roles" },
        { status: 500 }
      );
    }

    const targetRoles: string[] = (rolesData || []).map((r: { role: string }) => r.role);

    if (targetRoles.includes("superadmin")) {
      return NextResponse.json(
        { error: "Cannot impersonate another superadmin" },
        { status: 403 }
      );
    }

    const isTargetAdmin = targetRoles.includes("admin") || targetRoles.includes("superadmin");
    const isTargetBeta = targetRoles.includes("beta");
    const isTargetEmployer = targetRoles.includes("employer");
    const role = isTargetBeta
      ? "beta"
      : isTargetAdmin
        ? "admin"
        : isTargetEmployer
          ? "employer"
          : "user";

    const impersonateUser = {
      id: targetProfile.id,
      email: targetProfile.email ?? "",
      role,
      roles: targetRoles,
    };

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins
    let impersonationToken: string | null = null;

    try {
      const { data: adminSession, error: sessionErr } = await adminSupabase
        .from("admin_sessions")
        .insert({
          admin_id: session.user.id,
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
        admin_id: session.user.id,
        impersonated_user_id: userId,
        action_type: "impersonate",
      };
      await adminSupabase.from("admin_actions").insert(adminAction);
    } catch {
      // Table may not exist; ignore
    }

    return NextResponse.json({
      impersonateUser,
      ...(impersonationToken && { impersonationToken, expiresAt: expiresAt.toISOString() }),
    });
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
