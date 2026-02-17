import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getEnterpriseSession } from "@/lib/enterprise/requireEnterprise";
import { isSandboxRequest } from "@/lib/sandboxRequest";

/**
 * GET /api/enterprise/organizations
 * List organizations where current user is enterprise owner (or all for superadmin).
 * Demo orgs (sandbox/demo) only returned when isSandboxRequest(); production never sees them.
 */
export async function GET(req: NextRequest) {
  try {
    const ent = await getEnterpriseSession();
    const supabase = getSupabaseServer();

    const admin = await import("@/lib/admin/getAdminContext").then((m) => m.getAdminContext(req));
    const isSuperAdmin = admin.isSuperAdmin;
    const orgIds = isSuperAdmin ? null : ent.enterpriseOwnerOrgIds;
    if (orgIds != null && orgIds.length === 0) {
      return NextResponse.json({ success: true, organizations: [] });
    }

    let query = supabase
      .from("organizations")
      .select("id, name, slug, billing_tier, created_at, updated_at, mode, demo")
      .order("name");

    if (!isSandboxRequest(req)) {
      query = query.eq("mode", "production").eq("demo", false);
    }
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
