/**
 * Shared resume parse logic: download from storage, extract text, OpenAI structure, normalize.
 * Can update public.resumes row when resumeId provided. Never throws; returns result or error message.
 */

import { getSupabaseServer } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import OpenAI from "openai";
import { z } from "zod";

const BUCKET = "resumes";

const EmploymentSchema = z.object({
  company_name: z.string().min(1),
  job_title: z.string().optional().nullable(),
  start_date: z.string().min(4),
  end_date: z.string().optional().nullable(),
  is_current: z.boolean().optional(),
});

const ResumeParseSchema = z.object({
  employment: z.array(EmploymentSchema),
});

export type NormalizedEmployment = {
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  company_normalized: string;
};

function normalizeDate(s: string | null | undefined): string | null {
  if (s == null || s === "") return null;
  const trimmed = String(s).trim();
  if (/^(present|current|now)$/i.test(trimmed)) return null;
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return trimmed;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeEmployment(
  raw: z.infer<typeof EmploymentSchema>[]
): NormalizedEmployment[] {
  const seen = new Set<string>();
  const out: NormalizedEmployment[] = [];
  for (const item of raw) {
    const company = (item.company_name ?? "").trim();
    if (!company) continue;
    const start = normalizeDate(item.start_date ?? "");
    if (!start) continue;
    const endRaw = item.is_current ? null : (item.end_date ?? null);
    const end = normalizeDate(endRaw);
    if (end !== null && start !== null && end < start) continue;
    const company_normalized = company.toLowerCase().trim();
    const key = `${company_normalized}|${start}|${end ?? "null"}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      company_name: company,
      job_title: (item.job_title ?? "").trim() || "Unknown",
      start_date: start,
      end_date: end,
      is_current:
        item.is_current === true ||
        (end == null &&
          (String(item.end_date ?? "").toLowerCase().includes("present") ||
            String(item.end_date ?? "").trim() === "")),
      company_normalized,
    });
  }
  return out;
}

export type ParseResult =
  | { ok: true; employment: NormalizedEmployment[] }
  | { ok: false; error: string };

/**
 * Parse resume at path for user; optionally update resumes row.
 * Never throws. Returns parse result or error.
 */
export async function parseResumeAndUpdateRecord(
  path: string,
  userId: string,
  resumeId?: string | null
): Promise<ParseResult> {
  const sb = getSupabaseServer();

  const updateResume = async (
    _status: "parsed" | "failed",
    _parsedData: unknown,
    _parsingError: string | null
  ) => {
    if (!resumeId) return;
    // No resumes table; parse status is not persisted.
  };

  let downloadError: unknown;
  let fileData: Blob | null = null;
  try {
    const { data, error } = await sb.storage.from(BUCKET).download(path);
    downloadError = error;
    fileData = data;
  } catch (e) {
    downloadError = e;
  }

  if (downloadError || !fileData) {
    const errMsg = "Could not read file from storage.";
    await updateResume("failed", null, errMsg);
    return { ok: false, error: errMsg };
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());
  const ext = path.toLowerCase().endsWith(".docx") ? "docx" : "pdf";
  let rawText = "";

  try {
    if (ext === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      rawText = result?.text ?? "";
      await parser.destroy?.();
    } else {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value ?? "";
    }
  } catch (e) {
    const errMsg = "Could not extract text from file.";
    await updateResume("failed", null, errMsg);
    return { ok: false, error: errMsg };
  }

  if (!rawText || rawText.trim().length < 50) {
    const errMsg = "Not enough text to parse. Please add employment manually.";
    await updateResume("failed", null, errMsg);
    return { ok: false, error: errMsg };
  }

  if (!env.OPENAI_API_KEY) {
    const errMsg = "Parsing is temporarily unavailable.";
    await updateResume("failed", null, errMsg);
    return { ok: false, error: errMsg };
  }

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const prompt = `Extract employment history from the following resume text. Return a JSON object with a single key "employment" whose value is an array of objects. Each object must have: company_name (string), job_title (string), start_date (YYYY-MM-DD), end_date (YYYY-MM-DD or null if current/Present), is_current (boolean). Skip entries without company name or start date. If "Present" or "Current" is mentioned for end date, set end_date to null and is_current to true. Dates must be normalized to YYYY-MM-DD.

Resume text:
${rawText.slice(0, 12000)}`;

  let content: string;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    content = completion.choices?.[0]?.message?.content ?? "";
  } catch (e) {
    const errMsg = "AI parsing failed. Please add employment manually.";
    await updateResume("failed", null, errMsg);
    return { ok: false, error: errMsg };
  }

  if (!content) {
    const errMsg = "Could not extract structured employment data.";
    await updateResume("failed", null, errMsg);
    return { ok: false, error: errMsg };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    const errMsg = "Invalid parser response.";
    await updateResume("failed", null, errMsg);
    return { ok: false, error: errMsg };
  }

  const result = ResumeParseSchema.safeParse(parsed);
  if (!result.success) {
    const errMsg = "Invalid structured employment data from parser.";
    await updateResume("failed", null, errMsg);
    return { ok: false, error: errMsg };
  }

  const normalized = normalizeEmployment(result.data.employment);
  const payload = { employment: normalized };

  await updateResume("parsed", payload, null);
  return { ok: true, employment: normalized };
}
