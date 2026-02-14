/**
 * POST /api/resume/upload
 * Auth required. Single path: core processResumeUpload (store, parse, employment, matching).
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseSession } from "@/lib/supabase/server";
import { processResumeUpload } from "@/lib/core/resume";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { session } = await getSupabaseSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const organizationId = formData.get("organization_id");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const orgId =
      organizationId && typeof organizationId === "string" ? organizationId : null;
    const result = await processResumeUpload(session.user.id, file, orgId);

    if (result.ok && result.status === "parsed") {
      return NextResponse.json({
        id: result.resumeId,
        path: result.path,
        status: "parsed",
        parsed_data: { employment: result.employment },
        employment_record_ids: result.employmentRecordIds,
        coworker_matches_created: result.matchesCreated,
        message:
          "Resume uploaded and parsed. Jobs added to your profile; coworker matches will appear in Coworker Matches.",
      });
    }

    if (!result.ok && "status" in result && result.status === 400) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    if (!result.ok && "status" in result && result.status === 401) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    if (!result.ok && "resumeId" in result && result.resumeId) {
      return NextResponse.json({
        id: result.resumeId,
        path: result.path,
        status: "failed",
        parsing_error: result.parsingError ?? result.error,
        message: "Resume uploaded but parsing failed. You can add employment manually.",
      });
    }

    if (!result.ok && "error" in result) {
      const status = "status" in result && typeof result.status === "number" ? result.status : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  } catch (e) {
    console.error("[resume/upload] error:", e);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
