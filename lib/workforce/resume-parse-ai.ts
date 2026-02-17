/**
 * AI parsing: extracted text -> structured JSON. Fail in both sandbox and production if parsing fails.
 */

import OpenAI from "openai";
import { env } from "@/lib/env";
import type { ParsedResumeJson } from "./resume-types";

const PROMPT = `Extract structured data from the resume text. Return JSON with: full_name, email, phone (or ""), job_history (array of {company, title, start_date YYYY-MM-DD, end_date YYYY-MM-DD or null, location?}), skills (string[]), certifications (string[]). Normalize dates. Use null for Present/Current.`;

export async function parseResumeWithAI(extractedText: string): Promise<ParsedResumeJson> {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
  const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const content = (
    await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: PROMPT + "\n\n" + extractedText.slice(0, 14000) }],
      response_format: { type: "json_object" },
    })
  ).choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenAI empty content");
  const parsed = JSON.parse(content) as Record<string, unknown>;
  const jobs = Array.isArray(parsed.job_history) ? parsed.job_history : [];
  return {
    full_name: String(parsed.full_name ?? "").trim(),
    email: String(parsed.email ?? "").trim().toLowerCase(),
    phone: String(parsed.phone ?? "").trim(),
    job_history: jobs.map((e: Record<string, unknown>) => ({
      company: String(e.company ?? "").trim(),
      title: String(e.title ?? "").trim(),
      start_date: String(e.start_date ?? "").trim(),
      end_date: e.end_date == null ? null : String(e.end_date).trim(),
      location: e.location != null ? String(e.location).trim() : undefined,
    })),
    skills: Array.isArray(parsed.skills) ? parsed.skills.map(String) : [],
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications.map(String) : [],
  };
}
