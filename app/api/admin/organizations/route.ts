/**
 * GET /api/admin/organizations — list organizations (admin/super_admin). Org search by name/slug.
 * Demo orgs only when isSandboxRequest(); production never sees demo rows.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { isSandboxRequest } from "@/lib/sandboxRequest";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminContext();
    if (!admin.isAdmin) return adminForbiddenResponse();

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
      console.error("[admin/organizations]", error);
      return NextResponse.json({ error: "Failed to load organizations" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error("[admin/organizations]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
