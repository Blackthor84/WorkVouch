// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/admin/employers — list employers (organizations). Admin only. Sandbox-aware.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminContext } from "@/lib/admin/getAdminContext";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { admin } from "@/lib/supabase-admin";
import { getAdminSandboxModeFromCookies } from "@/lib/sandbox/sandboxContext";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const adminContext = await getAdminContext(req);
  if (!adminContext.isAdmin) return adminForbiddenResponse();

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim() || "";
    const isSandbox = await getAdminSandboxModeFromCookies();

    let query = admin.from("organizations")
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
