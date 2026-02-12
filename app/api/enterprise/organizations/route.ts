import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getEnterpriseSession } from "@/lib/enterprise/requireEnterprise";

/**
 * GET /api/enterprise/organizations
 * List organizations where current user is enterprise owner (or all for superadmin).
 */
export async function GET(_req: NextRequest) {
  try {
    const ent = await getEnterpriseSession();
    const supabase = getSupabaseServer();

    const isSuperAdmin =
      (await import("@/lib/admin/requireAdmin").then((m) => m.requireAdmin().catch(() => null))) != null;
    const orgIds = isSuperAdmin ? null : ent.enterpriseOwnerOrgIds;
    if (orgIds != null && orgIds.length === 0) {
      return NextResponse.json({ success: true, organizations: [] });
    }

    let query = supabase
      .from("organizations")
      .select("id, name, slug, billing_tier, created_at, updated_at")
      .order("name");
    if (orgIds != null) {
      query = query.in("id", orgIds);
    }
    const { data, error } = await query;

    if (error) {
      console.error("[ENTERPRISE_ORGS_GET]", error);
      return NextResponse.json(
        { success: false, error: "Failed to load organizations" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, organizations: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg === "Unauthorized")
      return NextResponse.json({ success: false, error: msg }, { status: 401 });
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
