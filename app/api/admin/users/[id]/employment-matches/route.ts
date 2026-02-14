import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { requireAdminForApi } from "@/lib/admin/requireAdmin";
import { adminForbiddenResponse } from "@/lib/admin/getAdminContext";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** GET: list employment_matches for this user (as record owner or matched_user). Admin only. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminForApi();
  if (!admin) return adminForbiddenResponse();
  const { id: userId } = await params;
  if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  const sb = getSupabaseServer();
  const { data: myRecords } = await sb.from("employment_records").select("id").eq("user_id", userId);
  const myRecordIds = (myRecords ?? []).map((r: { id: string }) => r.id);

  const [asOwnerRes, asMatchedRes] = await Promise.all([
    myRecordIds.length > 0
      ? sb.from("employment_matches").select("id, employment_record_id, matched_user_id, match_status, overlap_start, overlap_end").in("employment_record_id", myRecordIds)
      : Promise.resolve({ data: [] }),
    sb.from("employment_matches").select("id, employment_record_id, matched_user_id, match_status, overlap_start, overlap_end").eq("matched_user_id", userId),
  ]);

  const all = [
    ...(asOwnerRes.data ?? []),
    ...(asMatchedRes.data ?? []),
  ] as { id: string; employment_record_id: string; matched_user_id: string; match_status: string; overlap_start: string; overlap_end: string }[];

  const recordIds = [...new Set(all.map((m) => m.employment_record_id))];
  const { data: recs } = await sb.from("employment_records").select("id, company_name, user_id").in("id", recordIds);
  const recMap = Object.fromEntries(((recs ?? []) as { id: string; company_name: string; user_id: string }[]).map((r) => [r.id, r]));

  const enriched = all.map((m) => ({
    ...m,
    company_name: (recMap[m.employment_record_id] as { company_name: string })?.company_name ?? null,
    record_owner_id: (recMap[m.employment_record_id] as { user_id: string })?.user_id ?? null,
  }));

  return NextResponse.json(enriched);
}
