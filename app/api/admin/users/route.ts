// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

import { getUser } from "@/lib/auth/getUser";
import { admin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { auditLog, getAuditMetaFromRequest } from "@/lib/auditLogger";

export const runtime = "nodejs";

/**
 * GET /api/admin/users — list all users (super_admin only).
 * Role is read from profiles via admin client. Accepts super_admin (DB) and legacy superadmin.
 */
export async function GET(request: Request) {
  try {
    const user = await getUser();
    console.log("ADMIN CHECK USER:", user);

    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    console.log("ADMIN PROFILE:", profile, profileError?.message ?? "");

    if (profileError) {
      console.warn("[admin/users] profile fetch:", profileError.message);
    }

    const rawRole = (profile as { role?: string } | null)?.role ?? null;
    const normalized = String(rawRole ?? "")
      .toLowerCase()
      .trim()
      .replace(/-/g, "_");
    const isSuperAdmin =
      normalized === "super_admin" || normalized === "superadmin";

    if (!profile || !isSuperAdmin) {
      return NextResponse.json(
        { error: "Unauthorized", role: rawRole },
        { status: 403 }
      );
    }

    const { data: users, error } = await admin.from("profiles").select("*");

    console.log("USERS DATA:", users?.length ?? 0, "rows");
    if (error) {
      console.log("admin users error", error);
      return NextResponse.json([], { status: 200 });
    }

    if (!users) {
      return NextResponse.json([], { status: 200 });
    }

    const mapped = users.map((row: Record<string, unknown>) => ({
      id: row.id ?? row.user_id ?? "",
      email: row.email ?? "",
      role: row.role ?? "no role",
    }));

    const { ipAddress, userAgent } = getAuditMetaFromRequest(request);
    await auditLog({
      actorUserId: user.id,
      actorRole: isSuperAdmin ? "superadmin" : "admin",
      action: "admin_list_users",
      metadata: { count: mapped.length },
      ipAddress,
      userAgent,
    }).catch((err: unknown) => {
      console.error("[ADMIN_API_ERROR] auditLog", err instanceof Error ? err.message : err);
    });

    return NextResponse.json(mapped);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("[ADMIN_API_ERROR] GET /api/admin/users", error.message);
    } else {
      console.error("[ADMIN_API_UNKNOWN_ERROR] GET /api/admin/users");
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
