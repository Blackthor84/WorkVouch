/**
 * POST /api/resume/parse
 * Extract identity + employment from an uploaded resume. Rate limit: 3/user/day.
 */

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/getUser";
import { admin } from "@/lib/supabase-admin";
import { attachDuplicateHints } from "@/lib/resume/duplicate-detection";
import { isResumePathOwnedByUser, toStoragePath } from "@/lib/resume/path-utils";
import { parseResumeBuffer } from "@/lib/resume/parse-resume";
import { RESUME_BUCKET } from "@/lib/resume/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PARSE_LIMIT_PER_DAY = 3;
const PARSE_ENTITY_TYPE = "resume_parse";

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const body = await req.json().catch(() => ({}));
    const path = toStoragePath(typeof body.path === "string" ? body.path : "");

    if (!path) {
      return NextResponse.json({ error: "Missing file path" }, { status: 400 });
    }
    if (!isResumePathOwnedByUser(path, userId)) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 403 });
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { count } = await admin
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("entity_type", PARSE_ENTITY_TYPE)
      .eq("changed_by", userId)
      .gte("created_at", todayStart.toISOString());

    if ((count ?? 0) >= PARSE_LIMIT_PER_DAY) {
      return NextResponse.json(
        { error: "Parsing limit reached. Try again tomorrow." },
        { status: 429 }
      );
    }

    const { data: fileData, error: downloadError } = await admin.storage
      .from(RESUME_BUCKET)
      .download(path);

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: "Could not read your resume. Upload again and retry." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const parsed = await parseResumeBuffer(buffer, path);

    if (!parsed.ok) {
      const status =
        parsed.code === "PARSER_UNAVAILABLE" || parsed.code === "PARSER_TIMEOUT" ? 503 : 400;
      return NextResponse.json({ error: parsed.error, code: parsed.code }, { status });
    }

    const { data: existingRows } = await admin
      .from("employment_records")
      .select("id, company_name, company_normalized, job_title, start_date, end_date, is_current, verification_status")
      .eq("user_id", userId);

    const employment = attachDuplicateHints(
      parsed.data.employment,
      (existingRows ?? []).map((r) => ({
        id: r.id,
        company_name: r.company_name,
        company_normalized: r.company_normalized,
        job_title: r.job_title,
        start_date: r.start_date,
        end_date: r.end_date,
        is_current: r.is_current,
        verification_status: r.verification_status,
      }))
    );

    await admin.from("audit_logs").insert({
      entity_type: PARSE_ENTITY_TYPE,
      entity_id: userId,
      changed_by: userId,
      new_value: {
        path,
        employment_count: employment.length,
        parse_status: parsed.data.parse_status,
      },
      change_reason: "resume_parse",
    });

    return NextResponse.json({
      ...parsed.data,
      employment,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not parse this resume. Please add employment manually." },
      { status: 500 }
    );
  }
}
