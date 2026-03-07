/**
 * GET /api/user/employment-history — List employment records for current user.
 * Used by EmploymentHistoryPanel. Backend only; no placeholder.
 */

import { NextResponse } from "next/server";
import { getEffectiveUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type EmploymentHistoryEntry = {
  id: string;
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  verification_status: string;
};

export async function GET() {
  const effective = await getEffectiveUser();
  if (!effective?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: rows, error } = await supabase
    .from("employment_records")
    .select("id, company_name, job_title, start_date, end_date, is_current, verification_status")
    .eq("user_id", effective.id)
    .order("start_date", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = (rows ?? []) as EmploymentHistoryEntry[];
  return NextResponse.json({ entries: list });
}
