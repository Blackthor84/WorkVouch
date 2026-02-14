/**
 * GET /api/admin/employers — list employers (organizations). Admin only. Sandbox-aware.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { getAdminSandboxModeFromCookies } from "@/lib/sandbox/sandboxContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await getAdminContext();
  if (!admin.isAdmin) return adminForbiddenResponse();

  try {
    const supabase = getSupabaseServer();
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const isSandbox = await getAdminSandboxModeFromCookies();

    let query = supabase
      .from("organizations")
      .select("id, name, slug, billing_tier, demo, suspended_at, created_at, updated_at")
      .order("name");

    if (!isSandbox) {
      query = query.eq("demo", false);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
