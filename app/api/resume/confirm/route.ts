/**
 * POST /api/resume/confirm
 * User-confirmed resume extraction → pending employment_records + optional profile updates.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/getUser";
import { insertActivityLog } from "@/lib/activity";
import { confirmResumeExtraction } from "@/lib/resume/confirm-resume";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const employmentItemSchema = z.object({
  client_id: z.string().optional(),
  company_name: z.string().min(1).max(500).trim(),
  job_title: z.string().min(1).max(500).trim(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  is_current: z.boolean(),
  company_normalized: z.string().optional(),
  duplicate_action: z.enum(["create", "skip", "update"]).optional(),
  existing_record_id: z.string().uuid().nullable().optional(),
});

const identitySchema = z.object({
  apply: z.boolean(),
  full_name: z.string().max(200).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(50).nullable().optional(),
  country: z.string().max(10).nullable().optional(),
});

const confirmBodySchema = z.object({
  employment: z.array(employmentItemSchema).max(100),
  identity: identitySchema.optional(),
  resume_path: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = confirmBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid confirmation data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.employment.length === 0 && !parsed.data.identity?.apply) {
      return NextResponse.json(
        { error: "Add at least one employment entry or confirm profile information." },
        { status: 400 }
      );
    }

    const result = await confirmResumeExtraction({
      userId: user.id,
      employment: parsed.data.employment,
      identity: parsed.data.identity,
      resumePath: parsed.data.resume_path,
      cookieHeader: req.headers.get("cookie"),
    });

    insertActivityLog({
      userId: user.id,
      action: "employment_added",
      metadata: { count: result.record_ids.length, record_ids: result.record_ids, source: "resume" },
    }).catch(() => {});

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
  }
}
