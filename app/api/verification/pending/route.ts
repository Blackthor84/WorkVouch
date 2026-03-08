// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

/**
 * GET /api/verification/pending
 * Returns verification requests where current user is the target (by email or profile id).
 * Optional: ?token=xxx to fetch a single request by response token (for response page).
 */

import { NextRequest, NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { admin } from "@/lib/supabase-admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type PendingVerificationRequest = {
  id: string;
  requester_profile_id: string;
  target_email: string;
  employment_record_id: string;
  relationship_type: string;
  status: string;
  response_token: string | null;
  created_at: string;
  requester_name: string | null;
  company_name: string | null;
  job_title: string | null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token")?.trim() || null;
  if (token) {
    // Fetch single request by token (for response page; may be unauthenticated)
    const { data: row, error } = await admin.from("verification_requests")
      .select(`
        id,
        requester_profile_id,
        target_email,
        employment_record_id,
        relationship_type,
        status,
        response_token,
        created_at
      `)
      .eq("response_token", token)
      .eq("status", "pending")
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!row) {
      return NextResponse.json({ error: "Request not found or already responded" }, { status: 404 });
    }
    const r = row as Record<string, unknown>;
    const empId = r.employment_record_id as string;
    const { data: emp } = await admin.from("employment_records")
      .select("company_name, job_title")
      .eq("id", empId)
      .maybeSingle();
    const { data: prof } = await admin.from("profiles")
      .select("full_name")
      .eq("id", r.requester_profile_id as string)
      .maybeSingle();
    return NextResponse.json({
      request: {
        id: r.id,
        requester_profile_id: r.requester_profile_id,
        target_email: r.target_email,
        employment_record_id: r.employment_record_id,
        relationship_type: r.relationship_type,
        status: r.status,
        response_token: r.response_token,
        created_at: r.created_at,
        requester_name: (prof as { full_name?: string } | null)?.full_name ?? null,
        company_name: (emp as { company_name?: string } | null)?.company_name ?? null,
        job_title: (emp as { job_title?: string } | null)?.job_title ?? null,
      },
    });
  }

  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = effective.email ? effective.email.trim().toLowerCase() : null;
  const { data: profileRow } = await admin.from("profiles")
    .select("id")
    .or(`id.eq.${effective.id},user_id.eq.${effective.id}`)
    .maybeSingle();
  const profileId = (profileRow as { id: string } | null)?.id ?? effective.id;

  const orParts: string[] = [];
  if (profileId) orParts.push(`target_profile_id.eq.${profileId}`);
  if (email) orParts.push(`target_email.eq.${email}`);
  if (orParts.length === 0) {
    return NextResponse.json({ requests: [] });
  }

  const { data: rows, error } = await admin.from("verification_requests")
    .select("id, requester_profile_id, target_email, employment_record_id, relationship_type, status, response_token, created_at")
    .eq("status", "pending")
    .or(orParts.join(","))
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (rows ?? []) as Array<{
    id: string;
    requester_profile_id: string;
    target_email: string;
    employment_record_id: string;
    relationship_type: string;
    status: string;
    response_token: string | null;
    created_at: string;
  }>;

  const requesterIds = [...new Set(list.map((r) => r.requester_profile_id))];
  const empIds = [...new Set(list.map((r) => r.employment_record_id))];
  const [profilesData, empData] = await Promise.all([
    requesterIds.length > 0
      ? admin.from("profiles").select("id, full_name").in("id", requesterIds)
      : { data: [] },
    empIds.length > 0
      ? admin.from("employment_records").select("id, company_name, job_title").in("id", empIds)
      : { data: [] },
  ]);
  const profilesMap = new Map(
    ((profilesData.data ?? []) as { id: string; full_name?: string }[]).map((p) => [p.id, p])
  );
  const empMap = new Map(
    ((empData.data ?? []) as { id: string; company_name?: string; job_title?: string }[]).map((e) => [e.id, e])
  );

  const requests: PendingVerificationRequest[] = list.map((r) => {
    const prof = profilesMap.get(r.requester_profile_id);
    const emp = empMap.get(r.employment_record_id);
    return {
      id: r.id,
      requester_profile_id: r.requester_profile_id,
      target_email: r.target_email,
      employment_record_id: r.employment_record_id,
      relationship_type: r.relationship_type,
      status: r.status,
      response_token: r.response_token,
      created_at: r.created_at,
      requester_name: prof?.full_name ?? null,
      company_name: emp?.company_name ?? null,
      job_title: emp?.job_title ?? null,
    };
  });

  return NextResponse.json({ requests });
}
