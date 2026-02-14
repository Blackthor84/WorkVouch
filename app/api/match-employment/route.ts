/**
 * POST /api/match-employment
 * Creates employment record (if body has user_id, company_name, etc.) and runs coworker matching.
 * Same company_normalized + date overlap >= 30 days → pending employment_matches.
 * No auto-send emails (App Store compliant); user sees matches in-app only (Coworker Matches page).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseSession } from "@/lib/supabase/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const minOverlapDays = 30;
const msPerDay = 24 * 60 * 60 * 1000;

function overlapDays(
  start1: Date,
  end1: Date | null,
  start2: Date,
  end2: Date | null
): number {
  const s1 = start1.getTime();
  const e1 = (end1 ?? new Date()).getTime();
  const s2 = start2.getTime();
  const e2 = (end2 ?? new Date()).getTime();
  const overlapStart = Math.max(s1, s2);
  const overlapEnd = Math.min(e1, e2);
  if (overlapEnd <= overlapStart) return 0;
  return (overlapEnd - overlapStart) / msPerDay;
}

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

    const myStart = new Date(myRecord.start_date);
    const myEnd = myRecord.end_date ? new Date(myRecord.end_date) : null;

    const { data: others } = await sb
      .from("employment_records")
      .select("id, user_id, start_date, end_date")
      .eq("company_normalized", myRecord.company_normalized)
      .neq("user_id", myRecord.user_id);

    const created: { id: string; matched_user_id: string }[] = [];
    for (const row of others ?? []) {
      const theirStart = new Date(row.start_date);
      const theirEnd = row.end_date ? new Date(row.end_date) : null;
      const days = overlapDays(myStart, myEnd, theirStart, theirEnd);
      if (days < minOverlapDays) continue;

      const overlapStart = new Date(Math.max(myStart.getTime(), theirStart.getTime()));
      const overlapEnd = new Date(Math.min((myEnd ?? new Date()).getTime(), (theirEnd ?? new Date()).getTime()));

      const { data: existing } = await sb
        .from("employment_matches")
        .select("id")
        .eq("employment_record_id", employmentRecordId)
        .eq("matched_user_id", row.user_id)
        .maybeSingle();
      if (existing) continue;

      const { data: match, error: matchErr } = await sb
        .from("employment_matches")
        .insert({
          employment_record_id: employmentRecordId,
          matched_user_id: row.user_id,
          overlap_start: overlapStart.toISOString().slice(0, 10),
          overlap_end: overlapEnd.toISOString().slice(0, 10),
          match_status: "pending",
        })
        .select("id, matched_user_id")
        .single();
      if (matchErr) continue;
      if (match) created.push({ id: match.id, matched_user_id: match.matched_user_id });
    }

    return NextResponse.json({
      employment_record_id: employmentRecordId,
      matches_created: created.length,
      matches: created,
    });
  } catch (err: unknown) {
    console.error("[API][match-employment]", { err });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
