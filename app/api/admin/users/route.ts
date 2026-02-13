import { getSupabaseSession } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { auditLog, getAuditMetaFromRequest } from "@/lib/auditLogger";

/**
 * GET /api/admin/users — list all users (admin/superadmin only).
 * Hardened: try/catch, typed error, structured 500, audit log.
 */
export async function GET(request: Request) {
  try {
    const { session } = await getSupabaseSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const roles = (session.user as { roles?: string[] }).roles ?? [];
    const isAdmin = roles.includes("admin") || roles.includes("superadmin");
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseServer();
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("[ADMIN_API_ERROR] GET /api/admin/users profiles", profilesError.message);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }

    const { data: rolesData, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      console.error("[ADMIN_API_ERROR] GET /api/admin/users user_roles", rolesError.message);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }

    type RoleRow = { user_id: string; role: string };
    const rolesByUserId = ((rolesData ?? []) as RoleRow[]).reduce<Record<string, string[]>>(
      (acc, row) => {
        if (!acc[row.user_id]) acc[row.user_id] = [];
        acc[row.user_id].push(row.role);
        return acc;
      },
      {}
    );

    type ProfileRow = {
      id: string;
      email: string | null;
      full_name: string | null;
      created_at: string;
    };
    const users = ((profiles ?? []) as ProfileRow[]).map((p) => ({
      id: p.id,
      email: p.email ?? "",
      full_name: p.full_name ?? "",
      roles: rolesByUserId[p.id] ?? [],
      created_at: p.created_at,
    }));

    const { ipAddress, userAgent } = getAuditMetaFromRequest(request);
    await auditLog({
      actorUserId: session.user.id,
      actorRole: roles.includes("superadmin") ? "superadmin" : "admin",
      action: "admin_list_users",
      metadata: { count: users.length },
      ipAddress,
      userAgent,
    }).catch((err: unknown) => {
      console.error("[ADMIN_API_ERROR] auditLog", err instanceof Error ? err.message : err);
    });

    return NextResponse.json(users);
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
