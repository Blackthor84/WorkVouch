import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { requireAdminForApi } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Computed resume row (no resumes table). Built from employment_records. */
type ComputedResumeRow = {
  id: string;
  user_id: string;
  organization_id: string | null;
  file_path: string;
  status: string;
  parsed_data: unknown;
  parsing_error: string | null;
  created_at: string;
};

/**
 * GET /api/admin/resumes
 * Lists "resumes" as computed from employment_records. Optional filters: userId, organizationId (employer_id).
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId")?.trim() || undefined;
  const organizationId = url.searchParams.get("organizationId")?.trim() || undefined;
  const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10)));

  let resumes: ComputedResumeRow[] = [];
  try {
    const sb = getSupabaseServer();
    let query = sb
      .from("employment_records")
      .select("id, user_id, company_name, job_title, start_date, end_date, is_current, employer_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit * 5);

    if (userId) query = query.eq("user_id", userId);
    if (organizationId) query = query.eq("employer_id", organizationId);

    const { data: records, error } = await query;
    if (error) {
      console.warn("[admin/resumes] employment_records error:", error.message);
      return NextResponse.json({ resumes: [] });
    }

    const list = Array.isArray(records) ? records : [];
    const byUser = new Map<string, typeof list>();
    for (const r of list) {
      const uid = r.user_id as string;
      if (!byUser.has(uid)) byUser.set(uid, []);
      byUser.get(uid)!.push(r);
    }

    for (const [uid, recs] of byUser) {
      const employment = recs.map((r) => ({
        company_name: r.company_name ?? "",
        job_title: r.job_title ?? "",
        start_date: r.start_date ?? "",
        end_date: r.end_date ?? null,
        is_current: r.is_current ?? false,
      }));
      const created_at = recs.reduce((min, r) => (r.created_at < min ? r.created_at : min), recs[0].created_at);
      resumes.push({
        id: uid,
        user_id: uid,
        organization_id: (recs[0] as { employer_id?: string | null }).employer_id ?? null,
        file_path: "Career history",
        status: "parsed",
        parsed_data: { employment },
        parsing_error: null,
        created_at,
      });
      if (resumes.length >= limit) break;
    }
  } catch (e) {
    console.warn("[admin/resumes] error:", e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ resumes });
}
