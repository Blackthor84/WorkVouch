// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/admin/claim-requests
 * List employer claim requests. super_admin only.
 * On query failure, returns 200 + { claim_requests: [] } (no scary 500 for list).
 */

import { NextRequest, NextResponse } from "next/server";

import { requireSuperAdminApi } from "@/lib/admin/requireSuperAdminApi";
import { admin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireSuperAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") ?? "pending";
    let q = admin
      .from("employer_claim_requests")
      .select(
        "id, employer_id, requested_by_user_id, status, reviewed_by, reviewed_at, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (statusFilter && statusFilter !== "all") {
      q = q.eq("status", statusFilter);
    }

    const { data: rows, error } = await q;

    if (error) {
      console.warn("[admin/claim-requests] query error:", error.message);
      return NextResponse.json({ claim_requests: [] });
    }

    const list = Array.isArray(rows) ? rows : [];
    const employerIds = [
      ...new Set(list.map((r: { employer_id: string }) => r.employer_id)),
    ];
    const userIds = [
      ...new Set(
        list.map((r: { requested_by_user_id: string }) => r.requested_by_user_id)
      ),
    ];

    type EmployerRow = { id: string; company_name: string | null };
    type ProfileRow = { id: string; full_name: string | null; email: string | null };

    let employers: EmployerRow[] | null = null;
    let profiles: ProfileRow[] | null = null;

    if (employerIds.length > 0) {
      const er = await admin
        .from("employer_accounts")
        .select("id, company_name")
        .in("id", employerIds)
        .returns<EmployerRow[]>();
      if (er.error) {
        console.warn("[admin/claim-requests] employer_accounts:", er.error.message);
      } else {
        employers = er.data;
      }
    }

    if (userIds.length > 0) {
      const pr = await admin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds)
        .returns<ProfileRow[]>();
      if (pr.error) {
        console.warn("[admin/claim-requests] profiles:", pr.error.message);
      } else {
        profiles = pr.data;
      }
    }

    const employerMap = new Map<string, { company_name?: string | null }>();
    for (const e of employers ?? []) {
      employerMap.set(e.id, { company_name: e.company_name });
    }
    const profileMap = new Map<
      string,
      { full_name?: string | null; email?: string | null }
    >();
    for (const p of profiles ?? []) {
      profileMap.set(p.id, { full_name: p.full_name, email: p.email });
    }

    const items = list.map(
      (r: {
        id: string;
        employer_id: string;
        requested_by_user_id: string;
        status: string;
        reviewed_by: string | null;
        reviewed_at: string | null;
        created_at: string;
      }) => ({
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
      })
    );

    return NextResponse.json({ claim_requests: items });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[admin/claim-requests] failed:", msg);
    return NextResponse.json({ claim_requests: [] });
  }
}
