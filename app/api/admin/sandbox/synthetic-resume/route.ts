/**
 * POST /api/admin/sandbox/synthetic-resume
 * Sandbox-only. Create a synthetic resume record (fake parsed_data) for testing.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getAdminContext, adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { APP_MODE } from "@/lib/app-mode";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await getAdminContext(req);
  if (APP_MODE !== "sandbox" || !admin.canSeedData) return adminForbiddenResponse();

  try {
    const body = (await req.json().catch(() => ({}))) as { userId?: string };
    const userId = body.userId ?? admin.userId;
    const sb = getSupabaseServer();
    const { data: row, error } = await sb
      .from("employment_records")
      .insert({
        user_id: userId,
        company_name: "Sandbox Corp",
        company_normalized: "sandbox corp",
        job_title: "Engineer",
        start_date: "2020-01-01",
        end_date: "2022-12-31",
        is_current: false,
        verification_status: "pending",
      })
      .select("id, user_id, created_at")
      .single();

    if (error) {
      console.warn("[synthetic-resume] employment_records insert:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      resume: {
        id: (row as { id: string }).id,
        user_id: (row as { user_id: string }).user_id,
        status: "parsed",
        created_at: (row as { created_at: string }).created_at,
      },
    });
  } catch (e) {
    console.warn("[synthetic-resume] error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
