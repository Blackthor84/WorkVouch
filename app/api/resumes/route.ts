/**
 * GET /api/resumes
 * Lists current user's "resumes" as a computed view from employment_records.
 * No resumes table; data aggregated from employment_records. Production-safe.
 */

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export type ComputedResumeRow = {
  id: string;
  user_id: string;
  file_path: string;
  status: string;
  parsed_data: { employment?: { company_name: string; job_title: string; start_date: string; end_date: string | null; is_current: boolean }[] } | null;
  parsing_error: string | null;
  created_at: string;
};

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      return NextResponse.json({ error: "Service misconfigured" }, { status: 503 });
    }

    const supabase = await supabaseServer();
    const authResult = await supabase.auth.getUser();
    const user = authResult?.data?.user ?? null;
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: records, error } = await supabase
      .from("employment_records")
      .select("id, user_id, company_name, job_title, start_date, end_date, is_current, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[resumes] employment_records error:", error.message, error.code);
      return NextResponse.json({ resumes: [] });
    }

    const list = Array.isArray(records) ? records : [];
    const employment = list.map((r) => ({
      company_name: r.company_name ?? "",
      job_title: r.job_title ?? "",
      start_date: r.start_date ?? "",
      end_date: r.end_date ?? null,
      is_current: r.is_current ?? false,
    }));
    const created_at = list.length > 0
      ? list.reduce((min, r) => (r.created_at < min ? r.created_at : min), list[0].created_at)
      : new Date().toISOString();

    const computed: ComputedResumeRow = {
      id: user.id,
      user_id: user.id,
      file_path: "Career history",
      status: "parsed",
      parsed_data: employment.length > 0 ? { employment } : null,
      parsing_error: null,
      created_at,
    };

    return NextResponse.json({ resumes: list.length > 0 ? [computed] : [] });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.warn("[resumes] GET error:", message);
    return NextResponse.json({ resumes: [] });
  }
}
