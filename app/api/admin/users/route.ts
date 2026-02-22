import { getSupabaseSession } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { auditLog, getAuditMetaFromRequest } from "@/lib/auditLogger";

/** Local type for admin users list. Do not import Supabase-generated types here. */
type ProfileRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  role?: string | null;
  status?: string | null;
  isSandbox?: boolean | null;
};

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

    const supabase = getSupabaseServer();
    const { data: actorProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();
    const actorRole = (actorProfile as { role?: string } | null)?.role ?? "";
    const isAdmin = actorRole === "admin" || actorRole === "superadmin";
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(request.url);
    const searchEmail = url.searchParams.get("email")?.trim() || "";
    const searchName = url.searchParams.get("name")?.trim() || "";
    const searchOrg = url.searchParams.get("org")?.trim() || "";

    let query = supabase
      .from("profiles")
      .select("user_id, email, full_name, created_at, role, status, isSandbox")
      .order("created_at", { ascending: false });

    if (searchEmail) {
      query = query.ilike("email", `%${searchEmail}%`);
    }
    if (searchName) {
      query = query.ilike("full_name", `%${searchName}%`);
    }

    let profileIdsFilter: string[] | null = null;
    if (searchOrg) {
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id")
        .ilike("name", `%${searchOrg}%`);
      const orgIds = (orgs ?? []).map((o: { id: string }) => o.id);
      if (orgIds.length === 0) {
        profileIdsFilter = [];
      } else {
        const { data: members } = await supabase
          .from("tenant_memberships")
          .select("user_id")
          .in("organization_id", orgIds);
        profileIdsFilter = [...new Set((members ?? []).map((m: { user_id: string }) => m.user_id))];
      }
    }
    if (profileIdsFilter && profileIdsFilter.length === 0) {
      return NextResponse.json([]);
    }
    if (profileIdsFilter && profileIdsFilter.length > 0) {
      query = query.in("user_id", profileIdsFilter);
    }

    const { data, error } = await query.returns<ProfileRow[]>();

    if (error) {
      console.error("[admin/users] profiles error:", error);
      return NextResponse.json([], { status: 200 });
    }

    const rows = data ?? [];
    const users = rows.map((p) => ({
      id: p.user_id,
      userId: p.user_id,
      user_id: p.user_id,
      email: p.email ?? "",
      fullName: p.full_name ?? "",
      createdAt: p.created_at,
      role: p.role ?? "user",
      status: p.status ?? "active",
      isSandbox: p.isSandbox ?? false,
    }));

    const { ipAddress, userAgent } = getAuditMetaFromRequest(request);
    await auditLog({
      actorUserId: session.user.id,
      actorRole: actorRole === "superadmin" ? "superadmin" : "admin",
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
