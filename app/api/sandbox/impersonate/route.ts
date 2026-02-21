import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSuperadmin } from "@/lib/auth/requireSuperadmin";
import { getAuthedUser } from "@/lib/auth/getAuthedUser";
import { getServiceRoleClient } from "@/lib/supabase/serviceRole";
import { createImpersonationSession } from "@/lib/admin/impersonateLogic";
import { writeImpersonationAudit } from "@/lib/impersonationAudit";

export async function POST(req: Request) {
  try {
    if (process.env.SANDBOX_IMPERSONATION_ENABLED !== "true") {
      return NextResponse.json({ error: "Impersonation is disabled" }, { status: 403 });
    }

    const forbidden = await requireSuperadmin();
    if (forbidden) return forbidden;

    const authed = await getAuthedUser();
    if (!authed?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, type, name, sandboxId } = body ?? {};

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid id" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("id", id)
      .single();

    const role = (profile as { role?: string } | null)?.role?.toLowerCase();
    if (role === "admin" || role === "superadmin" || role === "super_admin") {
      return NextResponse.json(
        { error: "Workers only; cannot impersonate admins" },
        { status: 400 }
      );
    }

    if (profile?.id) {
      const targetProfile = { id: profile.id, email: (profile as { email?: string }).email ?? null, role: (profile as { role?: string }).role };
      const { impersonateUser, impersonationToken, expiresAt } = await createImpersonationSession(
        authed.user.id,
        targetProfile,
        authed.user.email
      );
      try {
        await writeImpersonationAudit({
          admin_user_id: authed.user.id,
          admin_email: authed.user.email ?? null,
          target_user_id: id,
          target_identifier: targetProfile.email ?? null,
          event: "start",
          environment: "sandbox",
          ip_address: null,
          user_agent: null,
        });
      } catch (e) {
        console.error("[sandbox/impersonate] impersonation_audit insert failed", e);
      }
      return NextResponse.json({
        impersonateUser,
        ...(impersonationToken && { impersonationToken, expiresAt: expiresAt.toISOString() }),
      });
    }

    const cookieStore = await cookies();
    cookieStore.set(
      "sandbox_playground_impersonation",
      JSON.stringify({
        id,
        type: type === "employer" ? "employer" : "employee",
        name: name ?? null,
        sandboxId: sandboxId ?? null,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8,
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("IMPERSONATE ERROR:", err);
    return NextResponse.json(
      { error: "Impersonation failed" },
      { status: 400 }
    );
  }
}
