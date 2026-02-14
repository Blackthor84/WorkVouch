/**
 * GET /api/admin/claim-requests
 * List pending (and optionally all) employer claim requests. Admin only.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getCurrentUser } from "@/lib/auth";
import { hasRole } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await hasRole("admin")) && !(await hasRole("superadmin"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") ?? "pending";

    const sb = getSupabaseServer() as any;
    let q = sb
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

    const { data: employers } = await sb.from("employer_accounts").select("id, company_name, user_id, claimed, claim_verified").in("id", employerIds);
    const { data: profiles } = await sb.from("profiles").select("id, full_name, email").in("id", userIds);

    const employerMap = new Map<string, { company_name?: string; user_id?: string; claimed?: boolean; claim_verified?: boolean }>();
    for (const e of employers ?? []) {
      const row = e as { id: string; company_name?: string; user_id?: string; claimed?: boolean; claim_verified?: boolean };
      employerMap.set(row.id, { company_name: row.company_name, user_id: row.user_id, claimed: row.claimed, claim_verified: row.claim_verified });
    }
    const profileMap = new Map<string, { full_name?: string; email?: string }>();
    for (const p of profiles ?? []) {
      const row = p as { id: string; full_name?: string; email?: string };
      profileMap.set(row.id, { full_name: row.full_name, email: row.email });
    }

    const items = list.map((r: { id: string; employer_id: string; requested_by_user_id: string; status: string; reviewed_by?: string; reviewed_at?: string; created_at: string }) => ({
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
