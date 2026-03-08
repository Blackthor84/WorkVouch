// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * POST /api/e2e/seed-verified-employment
 * Only when E2E_TEST_SECRET is set. Inserts one employment_record with verification_status=verified
 * for the given profileId so trust trajectory can move to "improving". Real DB row; no mocks.
 */

import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const E2E_SECRET = process.env.E2E_TEST_SECRET;

export async function POST(req: NextRequest) {
  if (!E2E_SECRET || E2E_SECRET.length < 16) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const profileId = (body as { profileId?: string }).profileId?.trim();
  if (!profileId || !/^[0-9a-f-]{36}$/i.test(profileId)) {
    return NextResponse.json({ error: "Missing or invalid profileId" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("employment_records")
    .insert({
      user_id: profileId,
      company_name: "E2E Test Co",
      company_normalized: "e2e test co",
      job_title: "E2E Verified Role",
      start_date: now.slice(0, 10),
      end_date: null,
      is_current: true,
      verification_status: "verified",
    })
    .select("id, updated_at")
    .single();

  if (error) {
    console.error("[e2e/seed-verified-employment]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: (data as { id: string }).id,
    updated_at: (data as { updated_at: string }).updated_at,
  });
}
