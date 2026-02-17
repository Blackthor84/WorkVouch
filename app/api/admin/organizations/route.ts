/**
 * GET /api/admin/organizations — list organizations (admin/super_admin). Org search by name/slug.
 * Demo orgs only when isSandboxRequest(); production never sees demo rows.
 * No logic runs before the guard; no 500s for expected conditions.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { isSandboxRequest } from "@/lib/sandboxRequest";
import { getRequestId } from "@/lib/requestContext";
import { logAdminAction } from "@/lib/adminAudit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await getAdminContext();
  if (!admin || !admin.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const requestId = getRequestId(req);
    const supabase = getSupabaseServer();
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() || "";

    let query = supabase
      .from("organizations")
      .select("*")
      .order("name");

    if (!isSandboxRequest(req)) {
      query = query.eq("mode", "production").eq("demo", false);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase organizations error:", error);
      return NextResponse.json(
        { error: "Failed to load organizations" },
        { status: 500 }
      );
    }

    const organizations = Array.isArray(data) ? data : [];

    if (admin?.userId) {
      try {
        logAdminAction({
          adminId: admin.userId,
          action: "READ",
          resource: "ORGANIZATIONS",
          requestId,
        });
      } catch {
        // Audit must never crash the route
      }
    }

    return NextResponse.json({ organizations });
  } catch (err) {
    console.error("[ADMIN_ORGS_FATAL]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
