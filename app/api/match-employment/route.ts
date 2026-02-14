/**
 * POST /api/match-employment
 * Creates employment record (if body has user_id, company_name, etc.).
 * Coworker matching uses coworker_matches only (employment_matches does not exist).
 * Returns employment_record_id; matches are read from coworker_matches on the Coworker Matches page.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseSession } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createBodySchema = z.object({
  user_id: z.string().uuid(),
  company_name: z.string().min(1).max(500),
  job_title: z.string().min(1).max(500),
  start_date: z.string(),
  end_date: z.string().optional().nullable(),
  is_current: z.boolean().optional().default(false),
});

const matchBodySchema = z.object({
  employment_record_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const { session } = await getSupabaseSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const sb = getSupabaseServer() as any;

    let employmentRecordId: string;

    if (body.employment_record_id) {
      const parsed = matchBodySchema.safeParse({ employment_record_id: body.employment_record_id });
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid employment_record_id" }, { status: 400 });
      }
      employmentRecordId = parsed.data.employment_record_id;
      const { data: rec, error: fetchErr } = await sb
        .from("employment_records")
        .select("id, user_id")
        .eq("id", employmentRecordId)
        .single();
      if (fetchErr || !rec) {
        return NextResponse.json({ error: "Employment record not found" }, { status: 404 });
      }
      if (rec.user_id !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      const parsed = createBodySchema.safeParse({
        user_id: body.user_id ?? session.user.id,
        company_name: body.company_name,
        job_title: body.job_title,
        start_date: body.start_date,
        end_date: body.end_date ?? null,
        is_current: body.is_current ?? false,
      });
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
      }
      const { user_id, company_name, job_title, start_date, end_date, is_current } = parsed.data;
      if (user_id !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const company_normalized = company_name.trim().toLowerCase();
      const { data: inserted, error: insertErr } = await sb
        .from("employment_records")
        .insert({
          user_id,
          company_name: company_name.trim(),
          company_normalized,
          job_title,
          start_date,
          end_date: end_date || null,
          is_current,
          verification_status: "pending",
        })
        .select("id")
        .single();
      if (insertErr || !inserted) {
        console.error("[match-employment] insert error:", insertErr);
        return NextResponse.json({ error: "Failed to create employment record" }, { status: 500 });
      }
      employmentRecordId = inserted.id;
      const { autoMatchEmployerAfterEmployment } = await import("@/lib/employment/autoMatchEmployer");
      const { recalculateMatchConfidence } = await import("@/lib/employment/matchConfidence");
      try {
        await autoMatchEmployerAfterEmployment(employmentRecordId, company_name.trim(), user_id);
        await recalculateMatchConfidence(employmentRecordId);
      } catch (err: unknown) {
        console.error("[API][match-employment] autoMatch/recalculate", { employmentRecordId, err });
      }
    }

    const { data: myRecord } = await sb
      .from("employment_records")
      .select("id, user_id, company_normalized, start_date, end_date")
      .eq("id", employmentRecordId)
      .single();
    if (!myRecord) {
      return NextResponse.json({ error: "Employment record not found" }, { status: 404 });
    }

    // Coworker matching is persisted in coworker_matches only (employment_matches does not exist).
    // Matching may be driven by jobs/coworker_matches flow elsewhere; here we only ensure the record exists.
    return NextResponse.json({
      employment_record_id: employmentRecordId,
      matches_created: 0,
      matches: [],
    });
  } catch (err: unknown) {
    console.error("[API][match-employment]", { err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
