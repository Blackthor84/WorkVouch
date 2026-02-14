/**
 * GET /api/admin/employers-list
 * List employer_accounts (id, company_name) for admin dropdowns.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasRole("admin")) && !(await hasRole("superadmin"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
