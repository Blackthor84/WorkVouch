import { getSupabaseSession } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
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
      .select("id, email, full_name, created_at, role")
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
      query = query.in("id", profileIdsFilter);
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      console.error("[ADMIN_API_ERROR] GET /api/admin/users profiles", profilesError.message);
      return NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      );
    }

    type ProfileRow = {
      id: string;
      email: string | null;
      full_name: string | null;
      created_at: string;
      role?: string | null;
    };
    const users = ((profiles ?? []) as ProfileRow[]).map((p) => ({
      id: p.id,
      email: p.email ?? "",
      full_name: p.full_name ?? "",
      role: p.role ?? null,
      created_at: p.created_at,
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
