/**
 * GET /api/admin/organizations — list organizations (admin/super_admin). Org search by name/slug.
 * Demo orgs only when isSandboxRequest(); production never sees demo rows.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { isSandboxRequest } from "@/lib/sandboxRequest";
import { requireAdmin } from "@/lib/adminApiGuard";
import { getRequestId } from "@/lib/requestContext";
import { logAdminAction } from "@/lib/adminAudit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const requestId = getRequestId(req);

  try {
    const admin = await getAdminContext();
    const guard = requireAdmin(admin);
    if (!guard.ok) {
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    const supabase = getSupabaseServer();
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() || "";

    let query = supabase
      .from("organizations")
      .select("id, name, slug, billing_tier, mode, demo, created_at, updated_at")
      .order("name");

    if (!isSandboxRequest(req)) {
      query = query.eq("mode", "production").eq("demo", false);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Admin API error:", { requestId, error: error.message });
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    logAdminAction({
      adminId: admin.userId,
      action: "READ",
      resource: "ORGANIZATIONS",
      requestId,
    });

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("Admin API error:", { requestId, err });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
