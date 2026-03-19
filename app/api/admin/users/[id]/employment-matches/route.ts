// IMPORTANT:
// All server routes must use the `admin` Supabase client.
// Do not use `supabase` in API routes.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { requireAdminForApi } from "@/lib/auth/requireAdminForApi";
import { adminForbiddenResponse } from "@/lib/api/adminResponses";
import { admin } from "@/lib/supabase-admin";
export const dynamic = "force-dynamic";

/** GET: list coworker matches for this user (employment_matches does not exist). Admin only. Fail soft. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const adminSession = await requireAdminForApi();
  if (!adminSession) return adminForbiddenResponse();
  const { id: userId } = await params;
  if (!userId) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

  let enriched: { id: string; employment_record_id: string; matched_user_id: string; match_status: string; overlap_start: string; overlap_end: string; company_name: string | null; record_owner_id: string | null }[] = [];
  try {
    const { data: rows } = await admin
      .from("coworker_matches")
      .select("id, user_id, coworker_id, company_name")
      .or(`user_id.eq.${userId},coworker_id.eq.${userId}`);

    const all = (rows ?? []) as { id: string; user_id: string; coworker_id: string; company_name: string }[];
    enriched = all.map((m) => {
      const otherId = m.user_id === userId ? m.coworker_id : m.user_id;
      const record_owner_id = m.user_id === userId ? m.user_id : m.coworker_id;
      return {
        id: m.id,
        employment_record_id: "",
        matched_user_id: otherId,
        match_status: "confirmed",
        overlap_start: "",
        overlap_end: "",
        company_name: m.company_name ?? null,
        record_owner_id,
      };
    });
  } catch (e) {
    console.warn("Optional admin employment-matches query failed", e);
  }
  return NextResponse.json(enriched);
}
