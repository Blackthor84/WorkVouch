// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/admin/claim-requests
 * List pending (and optionally all) employer claim requests. Admin only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminSupabase } from "@/lib/auth/requireAdminSupabase";
import { admin } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdminSupabase();
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") ?? "pending";
    let q = admin
      .from("employer_claim_requests")
      .select("id, employer_id, requested_by_user_id, status, reviewed_by, reviewed_at, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (statusFilter && statusFilter !== "all") {
      q = q.eq("status", statusFilter);
    }

    const { data: rows, error } = await q;

    if (error) {
      console.error("[admin/claim-requests]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = Array.isArray(rows) ? rows : [];
    const employerIds = [...new Set(list.map((r: { employer_id: string }) => r.employer_id))];
    const userIds = [...new Set(list.map((r: { requested_by_user_id: string }) => r.requested_by_user_id))];

    type EmployerRow = { id: string; company_name: string | null };
    type ProfileRow = { id: string; full_name: string | null; email: string | null };
    const { data: employers } = await admin
      .from("employer_accounts")
      .select("id, company_name")
      .in("id", employerIds)
      .returns<EmployerRow[]>();
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds)
      .returns<ProfileRow[]>();

    const employerMap = new Map<string, { company_name?: string | null }>();
    for (const e of employers ?? []) {
      employerMap.set(e.id, { company_name: e.company_name });
    }
    const profileMap = new Map<string, { full_name?: string | null; email?: string | null }>();
    for (const p of profiles ?? []) {
      profileMap.set(p.id, { full_name: p.full_name, email: p.email });
    }

    const items = list.map((r: { id: string; employer_id: string; requested_by_user_id: string; status: string; reviewed_by: string | null; reviewed_at: string | null; created_at: string }) => ({
      id: r.id,
      employer_id: r.employer_id,
      requested_by_user_id: r.requested_by_user_id,
      status: r.status,
      reviewed_by: r.reviewed_by,
      reviewed_at: r.reviewed_at,
      created_at: r.created_at,
      company_name: employerMap.get(r.employer_id)?.company_name,
      requester_name: profileMap.get(r.requested_by_user_id)?.full_name,
      requester_email: profileMap.get(r.requested_by_user_id)?.email,
    }));

    return NextResponse.json({ claim_requests: items });
  } catch (e) {
    console.error("[admin/claim-requests]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
