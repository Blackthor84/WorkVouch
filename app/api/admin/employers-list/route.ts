/**
 * GET /api/admin/employers-list
 * List employer_accounts (id, company_name) for admin dropdowns.
 */

import { NextResponse } from "next/server";
import { requireAdminSupabase } from "@/lib/auth/requireAdminSupabase";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAdminSupabase();
    if (auth instanceof NextResponse) return auth;

    const sb = getSupabaseServer() as any;
    const { data: rows } = await sb
      .from("employer_accounts")
      .select("id, company_name")
      .order("company_name")
      .limit(500);

    const list = Array.isArray(rows) ? rows : [];
    return NextResponse.json({ employers: list });
  } catch (e) {
    console.error("[admin/employers-list]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
