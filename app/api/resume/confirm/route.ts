/**
 * POST /api/resume/confirm
 * Auth required. Validates employment array with Zod, inserts into employment_records
 * with verification_status = "pending", triggers match-employment for each record,
 * logs to audit_logs. Does not insert until user confirms.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { z } from "zod";

export const dynamic = "force-dynamic";

const employmentItemSchema = z.object({
  company_name: z.string().min(1).max(500).trim(),
  job_title: z.string().min(1).max(500).trim(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  is_current: z.boolean(),
  company_normalized: z.string().optional(),
});

const confirmBodySchema = z.object({
  employment: z.array(employmentItemSchema).min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const parsed = confirmBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid employment data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { employment } = parsed.data;
    const sb = getSupabaseServer();

    const insertedIds: string[] = [];
    for (const item of employment) {
      const company_normalized =
        (item.company_normalized ?? item.company_name.trim().toLowerCase()) || item.company_name.trim().toLowerCase();
      const { data: row, error } = await sb
        .from("employment_records")
        .insert({
          user_id: userId,
          company_name: item.company_name.trim(),
          company_normalized,
          job_title: item.job_title.trim(),
          start_date: item.start_date,
          end_date: item.end_date,
          is_current: item.is_current,
          verification_status: "pending",
        })
        .select("id")
        .single();

      if (error || !row) {
        console.error("[resume/confirm] insert error:", error);
        return NextResponse.json(
          { error: "Failed to save employment record." },
          { status: 500 }
        );
      }
      insertedIds.push(row.id);
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const cookieHeader = req.headers.get("cookie");

    for (const recordId of insertedIds) {
      try {
        await fetch(`${baseUrl}/api/match-employment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
          },
          body: JSON.stringify({ employment_record_id: recordId }),
        });
      } catch (e) {
        console.error("[resume/confirm] match-employment call failed:", e);
      }
    }

    await sb.from("audit_logs").insert({
      entity_type: "resume_import",
      entity_id: userId,
      changed_by: userId,
      new_value: {
        employment_count: insertedIds.length,
        record_ids: insertedIds,
      } as Record<string, unknown>,
      change_reason: "resume_import_confirmed",
    });

    return NextResponse.json({
      success: true,
      record_ids: insertedIds,
      matches_triggered: insertedIds.length,
    });
  } catch (e) {
    console.error("[resume/confirm] error:", e);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
