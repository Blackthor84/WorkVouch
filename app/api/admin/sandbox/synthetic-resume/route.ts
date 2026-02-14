/**
 * POST /api/admin/sandbox/synthetic-resume
 * Sandbox-only. Create a synthetic resume record (fake parsed_data) for testing.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminContext, adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { APP_MODE } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await getAdminContext();
  if (APP_MODE !== "sandbox" || !admin.canSeedData) return adminForbiddenResponse();

  try {
    const body = (await req.json().catch(() => ({}))) as { userId?: string };
    const userId = body.userId ?? admin.userId;
    const sb = getSupabaseServer();
    const path = `sandbox/${userId}/synthetic-${Date.now()}.pdf`;
    const parsed_data = {
      employment: [
        { company_name: "Sandbox Corp", job_title: "Engineer", start_date: "2020-01-01", end_date: "2022-12-31", is_current: false, company_normalized: "sandbox corp" },
      ],
    };
    const { data: row, error } = await sb
      .from("resumes")
      .insert({
        user_id: userId,
        organization_id: null,
        file_path: path,
        parsed_data,
        status: "parsed",
        updated_at: new Date().toISOString(),
      })
      .select("id, user_id, status, created_at")
      .single();

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, resume: row });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal error" }, { status: 500 });
  }
}
