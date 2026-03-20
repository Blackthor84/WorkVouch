// GET /api/admin/control-center/matches — super_admin. Coworker matches for monitoring.

import { NextResponse } from "next/server";

import { requireSuperAdminApi } from "@/lib/admin/requireSuperAdminApi";
import { admin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSuperAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    let rows: Record<string, unknown>[] | null = null;
    const tryWide = await admin
      .from("coworker_matches")
      .select("id, status, company_name, user_1, user_2, user1_id, user2_id, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    rows = (tryWide.data as Record<string, unknown>[]) ?? null;
    if (tryWide.error) {
      const tryNarrow = await admin
        .from("coworker_matches")
        .select("id, status, company_name, user1_id, user2_id, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      rows = (tryNarrow.data as Record<string, unknown>[]) ?? null;
      if (tryNarrow.error) {
        console.warn("[control-center/matches]", tryNarrow.error.message);
        return NextResponse.json({ matches: [] });
      }
    }

    const matches = (rows ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id ?? ""),
      status: String(r.status ?? "pending"),
      company: (r.company_name as string) ?? "—",
      user_1: String((r.user_1 ?? r.user1_id) ?? ""),
      user_2: String((r.user_2 ?? r.user2_id) ?? ""),
      created_at: (r.created_at as string) ?? null,
    }));

    return NextResponse.json({ matches });
  } catch (e) {
    console.warn("[control-center/matches]", e);
    return NextResponse.json({ matches: [] });
  }
}
