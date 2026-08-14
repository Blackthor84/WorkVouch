/**
 * Resume Intelligence parser — identity + employment with confidence.
 * Does not persist data; callers handle storage after user confirmation.
 */

import { randomUUID } from "crypto";
import OpenAI from "openai";
import { z } from "zod";
import { env } from "@/lib/env";
import { numericToConfidence } from "./confidence";
import { extractTextFromResumeBuffer } from "./extract-text";
import { normalizeResumeDate } from "./normalize-dates";
import type {
  ExtractedEmployment,
  ExtractedField,
  ExtractedIdentity,
  ResumeParseResponse,
} from "./types";

const FieldSchema = z.object({
  value: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

const EmploymentItemSchema = z.object({
  company_name: z.string().min(1),
  job_title: z.string().optional().nullable(),
  start_date: z.string().min(4),
  end_date: z.string().optional().nullable(),
  is_current: z.boolean().optional(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  employment_type: z.string().optional().nullable(),
  confidence: z.number().min(0).max(1).optional(),
});

const RawParseSchema = z.object({
  identity: z
    .object({
      full_name: FieldSchema.optional(),
      email: FieldSchema.optional(),
      phone: FieldSchema.optional(),
      city: FieldSchema.optional(),
      state: FieldSchema.optional(),
      country: FieldSchema.optional(),
    })
    .optional(),
  employment: z.array(EmploymentItemSchema).default([]),
});

export type ParseResumeResult =
  | { ok: true; data: ResumeParseResponse }
  | { ok: false; error: string; code: string };

function toField(raw: z.infer<typeof FieldSchema> | undefined): ExtractedField<string> | undefined {
  const value = raw?.value?.trim();
  if (!value) return undefined;
  return {
    value,
    confidence: numericToConfidence(raw?.confidence),
    source: "resume",
  };
}

/** Strip street-level detail; keep city/state/country only for display */
function sanitizeLocationField(value: string): string {
  const lines = value.split(/\n|,/).map((s) => s.trim()).filter(Boolean);
  if (lines.length <= 3) return lines.join(", ");
  return lines.slice(-3).join(", ");
}

function normalizeEmploymentItems(
  raw: z.infer<typeof EmploymentItemSchema>[]
): ExtractedEmployment[] {
  const seen = new Set<string>();
  const out: ExtractedEmployment[] = [];

  for (const item of raw) {
    const company = (item.company_name ?? "").trim();
    if (!company) continue;
    const start = normalizeResumeDate(item.start_date);
    if (!start) continue;

    const endRaw = item.is_current ? null : (item.end_date ?? null);
    const end = normalizeResumeDate(endRaw);
    if (end !== null && end < start) continue;

    const company_normalized = company.toLowerCase().trim();
    const key = `${company_normalized}|${start}|${end ?? "null"}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const isCurrent =
      item.is_current === true ||
      (end == null &&
        (String(item.end_date ?? "").toLowerCase().includes("present") ||
          String(item.end_date ?? "").trim() === ""));

    out.push({
      client_id: randomUUID(),
      company_name: company,
      job_title: (item.job_title ?? "").trim() || "Unknown",
      start_date: start,
      end_date: end,
      is_current: isCurrent,
      company_normalized,
      location: item.location ? sanitizeLocationField(item.location.trim()) : null,
      description: item.description?.trim() || null,
      employment_type: item.employment_type?.trim() || null,
      confidence: numericToConfidence(item.confidence),
      source: "resume",
      duplicate_of: null,
      duplicate_match_reason: null,
    });
  }

  return out;
}

function buildIdentity(raw: z.infer<typeof RawParseSchema>["identity"]): ExtractedIdentity {
  const identity: ExtractedIdentity = {};
  const fullName = toField(raw?.full_name);
  const email = toField(raw?.email);
  const phone = toField(raw?.phone);
  const city = toField(raw?.city);
  const state = toField(raw?.state);
  const country = toField(raw?.country);

  if (fullName) identity.full_name = fullName;
  if (email) identity.email = email;
  if (phone) identity.phone = phone;
  if (city) identity.city = { ...city, value: sanitizeLocationField(city.value) };
  if (state) identity.state = state;
  if (country) identity.country = country;

  return identity;
}

export async function parseResumeBuffer(
  buffer: Buffer,
  path: string
): Promise<ParseResumeResult> {
  const extracted = await extractTextFromResumeBuffer(buffer, path);
  if (!extracted.ok) {
    return { ok: false, error: extracted.error, code: extracted.code };
  }

  const rawText = extracted.text;
  if (rawText.length < 30) {
    return {
      ok: false,
      error: "Not enough text to parse. Try a different file or add employment manually.",
      code: "INSUFFICIENT_TEXT",
    };
  }

  if (!env.OPENAI_API_KEY) {
    return {
      ok: false,
      error: "Resume parsing is temporarily unavailable.",
      code: "PARSER_UNAVAILABLE",
    };
  }

  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const prompt = `Extract structured identity and employment history from this resume text.

Return JSON with:
- identity: optional object with full_name, email, phone, city, state, country — each as { "value": string, "confidence": number 0-1 }
  Do NOT include street address or ZIP in any field. City/state/country only.
- employment: array of jobs with company_name, job_title, start_date (YYYY-MM-DD), end_date (YYYY-MM-DD or null if current), is_current, location (city/state only, no street), description, employment_type, confidence (0-1)

Skip jobs without company or start date. Normalize dates to YYYY-MM-DD. Present/Current → end_date null, is_current true.

Resume text:
${rawText.slice(0, 14000)}`;

  let content: string;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });
    content = completion.choices?.[0]?.message?.content ?? "";
  } catch {
    return {
      ok: false,
      error: "Parsing timed out. Please try again or add employment manually.",
      code: "PARSER_TIMEOUT",
    };
  }

  if (!content) {
    return {
      ok: false,
      error: "Could not extract data from this resume.",
      code: "PARSE_FAILED",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return {
      ok: false,
      error: "Could not extract data from this resume.",
      code: "PARSE_FAILED",
    };
  }

  const result = RawParseSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error: "Could not extract structured data from this resume.",
      code: "PARSE_INVALID",
    };
  }

  const identity = buildIdentity(result.data.identity);
  const employment = normalizeEmploymentItems(result.data.employment);
  const warnings: string[] = [];

  if (!identity.full_name) {
    warnings.push("No name was detected. You can add it manually before saving.");
  }
  if (employment.length === 0) {
    warnings.push("No employment history was detected. Add jobs manually or try another file.");
  }

  const parse_status =
    employment.length === 0 ? "no_employment" : warnings.length > 0 ? "partial" : "complete";

  return {
    ok: true,
    data: {
      identity,
      employment,
      parse_status,
      warnings,
    },
  };
}
