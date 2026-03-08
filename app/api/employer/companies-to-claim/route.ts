// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/employer/companies-to-claim
 * List employer_accounts that are not yet claimed (for claim request dropdown/search).
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: rows } = await admin
      .from("employer_accounts")
      .select("id, company_name")
      .eq("claimed", false)
      .order("company_name")
      .limit(200);

    const list = Array.isArray(rows) ? rows : [];
    return NextResponse.json({ companies: list.map((r: { id: string; company_name: string }) => ({ id: r.id, company_name: r.company_name })) });
  } catch (e) {
    console.error("[employer/companies-to-claim]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
