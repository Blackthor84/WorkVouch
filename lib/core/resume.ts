/**
 * Core resume pipeline. Single execution path for sandbox and production.
 * Store raw, parse, normalize, insert employment, trigger coworker matching.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { parseResumeAndUpdateRecord } from "@/lib/resume/parseAndStore";
import { insertEmploymentFromResume } from "@/lib/employment/insertFromResume";
import { randomUUID } from "crypto";

const BUCKET = "resumes";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export type ProcessResumeUploadResult =
  | {
      ok: true;
      resumeId: string;
      path: string;
      status: "parsed";
      employmentRecordIds: string[];
      matchesCreated: number;
      employment: { company_name: string; job_title: string; start_date: string; end_date: string | null }[];
    }
  | {
      ok: false;
      resumeId?: string;
      path?: string;
      status: "failed";
      error: string;
      parsingError?: string;
    }
  | { ok: false; error: string; status: 400 | 401 | 500 };

export async function processResumeUpload(
  userId: string,
  file: File,
  organizationId: string | null
): Promise<ProcessResumeUploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: "Invalid file type. Only PDF and DOCX are allowed.", status: 400 };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File size exceeds 5MB limit.", status: 400 };
  }

  const ext = file.type === "application/pdf" ? "pdf" : "docx";
  const path = `${userId}/${randomUUID()}.${ext}`;
  const sb = getSupabaseServer();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) {
    console.error("[core/resume] storage error:", uploadError);
    return { ok: false, error: "Failed to upload file.", status: 500 };
  }

  const resumeId = path;
  const parseResult = await parseResumeAndUpdateRecord(path, userId, null);

  if (parseResult.ok) {
    const { employmentRecordIds, matchesCreated } = await insertEmploymentFromResume(userId, parseResult.employment);
    return {
      ok: true,
      resumeId,
      path,
      status: "parsed",
      employmentRecordIds,
      matchesCreated,
      employment: parseResult.employment.map((j) => ({
        company_name: j.company_name,
        job_title: j.job_title,
        start_date: j.start_date,
        end_date: j.end_date,
      })),
    };
  }

  return {
    ok: false,
    resumeId,
    path,
    status: "failed",
    error: parseResult.error,
    parsingError: parseResult.error,
  };
}
