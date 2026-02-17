/**
 * GET /api/admin/organizations — list organizations (admin/super_admin). Org search by name/slug.
 * Demo orgs only when isSandboxRequest(); production never sees demo rows.
 * Diagnostic: env validation, safe Supabase use, no audit (temporarily disabled).
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { isSandboxRequest } from "@/lib/sandboxRequest";

export const dynamic = "force-dynamic";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("Missing SUPABASE URL");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SERVICE ROLE KEY");
}

export async function GET(req: NextRequest) {
  const admin = await getAdminContext();
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
      console.error("Organizations query failed:", error);
      return NextResponse.json(
        {
          error: "Organizations query failed",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      organizations: Array.isArray(data) ? data : [],
    });
  } catch (err) {
    console.error("[ADMIN_ORGS_FATAL]", err);
    return NextResponse.json(
      { error: "Unhandled organizations failure" },
      { status: 500 }
    );
  }
}
