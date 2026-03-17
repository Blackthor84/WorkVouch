// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

import { getUser } from "@/lib/auth/getUser";
import { admin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { auditLog, getAuditMetaFromRequest } from "@/lib/auditLogger";

export const runtime = "nodejs";

/**
 * GET /api/admin/users — list all users (admin/superadmin only).
 * Hardened: try/catch, typed error, structured 500, audit log.
 */
export async function GET(request: Request) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const { data: actorProfile } = await admin.from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const actorRole = (actorProfile as { role?: string } | null)?.role ?? "";
    const isAdmin = actorRole === "admin" || actorRole === "superadmin";
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // DEBUG: no filters — fetch all profiles (table is "profiles", not "users")
    const { data: users, error } = await admin.from("profiles").select("*");

    console.log("USERS DATA:", users);
    console.log("USERS ERROR:", error);

    if (error) {
      console.error("[admin/users] profiles error:", error);
      return NextResponse.json({ error: "Error loading users" }, { status: 500 });
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
      actorRole: actorRole === "superadmin" ? "superadmin" : "admin",
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
