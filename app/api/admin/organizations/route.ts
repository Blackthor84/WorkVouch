/**
 * GET /api/admin/organizations — list organizations (admin/super_admin). Org search by name/slug.
 * Demo orgs only when isSandboxRequest(); production never sees demo rows.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { isSandboxRequest } from "@/lib/sandboxRequest";
import { getRequestId } from "@/lib/requestContext";
import { logAdminAction } from "@/lib/adminAudit";

export const dynamic = "force-dynamic";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("Missing SUPABASE URL");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SERVICE ROLE KEY");
}

export async function GET(req: NextRequest) {
  const admin = await getAdminContext(req);
  if (!admin || !admin.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = getSupabaseServer();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not initialized" },
        { status: 500 }
      );
    }

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
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500 }
      );
    }

    const organizations = Array.isArray(data) ? data : [];

    logAdminAction({
      adminId: admin.authUserId,
      action: "READ",
      resource: "ORGANIZATIONS",
      requestId: getRequestId(req),
    });

    return NextResponse.json({ organizations });
  } catch (err) {
    console.error("[ADMIN_API_ERROR]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
