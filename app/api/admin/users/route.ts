// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

import { getUser } from "@/lib/auth/getUser";
import { admin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { auditLog, getAuditMetaFromRequest } from "@/lib/auditLogger";

export const runtime = "nodejs";

/**
 * GET /api/admin/users — list users (super_admin only).
 * Query: ?q= search email / full_name
 */
export async function GET(request: Request) {
  try {
    const user = await getUser();

    if (!user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

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

    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";

    let query = admin
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (q) {
      const safe = q.replace(/%/g, "\\%").replace(/_/g, "\\_");
      query = query.or(`email.ilike.%${safe}%,full_name.ilike.%${safe}%`);
    }

    const { data: users, error } = await query;

    if (error) {
      console.warn("admin users error", error.message);
      return NextResponse.json([], { status: 200 });
    }

    if (!users?.length) {
      return NextResponse.json([], { status: 200 });
    }

    const ids = users.map((u) => u.id).filter(Boolean);
    const { data: trustRows } = await admin
      .from("trust_scores")
      .select("user_id, score")
      .in("user_id", ids);

    const trustMap = new Map<string, number>();
    for (const t of trustRows ?? []) {
      if (t.user_id != null && t.score != null) {
        trustMap.set(t.user_id, Number(t.score));
      }
    }

    const mapped = users.map((row) => ({
      id: row.id,
      email: row.email ?? "",
      full_name: row.full_name ?? "",
      role: row.role ?? "user",
      trust_score: trustMap.get(row.id) ?? null,
      created_at: row.created_at ?? null,
    }));

    const { ipAddress, userAgent } = getAuditMetaFromRequest(request);
    await auditLog({
      actorUserId: user.id,
      actorRole: "superadmin",
      action: "admin_list_users",
      metadata: { count: mapped.length, search: q || null },
      ipAddress,
      userAgent,
    }).catch((err: unknown) => {
      console.error("[ADMIN_API_ERROR] auditLog", err instanceof Error ? err.message : err);
    });

    return NextResponse.json(mapped);
  } catch (error: unknown) {
    console.warn("[ADMIN_API_ERROR] GET /api/admin/users", error);
    return NextResponse.json([], { status: 200 });
  }
}
