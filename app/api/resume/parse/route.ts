/**
 * POST /api/resume/parse
 * Receives uploaded file path, fetches from Supabase (service role), extracts text,
 * sends to OpenAI for structured employment JSON. Normalizes and returns employment array.
 * Rate limit: 3 attempts per user per day. Does not store raw resume text.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const BUCKET = "resumes";
const PARSE_LIMIT_PER_DAY = 3;
const PARSE_ENTITY_TYPE = "resume_parse";

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
  raw: Array<{
    company_name?: string | null;
    job_title?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    is_current?: boolean;
  }>
): Array<{
  company_name: string;
  job_title: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  company_normalized: string;
}> {
  const seen = new Set<string>();
  const out: Array<{
    company_name: string;
    job_title: string;
    start_date: string;
    end_date: string | null;
    is_current: boolean;
    company_normalized: string;
  }> = [];

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
      is_current: item.is_current === true || (end == null && (String(item.end_date ?? "").toLowerCase().includes("present") || String(item.end_date ?? "").trim() === "")),
      company_normalized,
    });
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const path = typeof body.path === "string" ? body.path.trim() : "";

    if (!path) {
      return NextResponse.json({ error: "Missing file path" }, { status: 400 });
    }
    if (!path.startsWith(userId + "/") || path.includes("..")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 403 });
    }

    const sb = getSupabaseServer();

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const { count } = await sb
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

    const { data: fileData, error: downloadError } = await sb.storage
      .from(BUCKET)
      .download(path);

    if (downloadError || !fileData) {
      console.error("[resume/parse] download error:", downloadError);
      return NextResponse.json(
        { error: "Could not extract structured employment data. Please add manually." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const ext = path.toLowerCase().endsWith(".docx") ? "docx" : "pdf";
    let rawText = "";

    if (ext === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const result = await parser.getText();
        rawText = result?.text ?? "";
        await parser.destroy?.();
      } catch (e) {
        console.error("[resume/parse] pdf-parse error:", e);
        return NextResponse.json(
          { error: "Could not extract structured employment data. Please add manually." },
          { status: 400 }
        );
      }
    } else {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      rawText = result.value ?? "";
    }

    if (!rawText || rawText.trim().length < 50) {
      return NextResponse.json(
        { error: "Could not extract structured employment data. Please add manually." },
        { status: 400 }
      );
    }

    if (!env.OPENAI_API_KEY) {
      console.error("[resume/parse] OPENAI_API_KEY not set");
      return NextResponse.json(
        { error: "Could not extract structured employment data. Please add manually." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const prompt = `Extract employment history from the following resume text. Return a JSON object with a single key "employment" whose value is an array of objects. Each object must have: company_name (string), job_title (string), start_date (YYYY-MM-DD), end_date (YYYY-MM-DD or null if current/Present), is_current (boolean). Skip entries without company name or start date. If "Present" or "Current" is mentioned for end date, set end_date to null and is_current to true. Dates must be normalized to YYYY-MM-DD.

Resume text:
${rawText.slice(0, 12000)}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Could not extract structured employment data. Please add manually." },
        { status: 400 }
      );
    }

    let parsed: { employment?: unknown[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      return NextResponse.json(
        { error: "Could not extract structured employment data. Please add manually." },
        { status: 400 }
      );
    }

    const employment = Array.isArray(parsed.employment) ? parsed.employment : [];
    const normalized = normalizeEmployment(employment);

    await sb.from("audit_logs").insert({
      entity_type: PARSE_ENTITY_TYPE,
      entity_id: userId,
      changed_by: userId,
      new_value: { path, employment_count: normalized.length } as Record<string, unknown>,
      change_reason: "resume_parse",
    });

    return NextResponse.json({ employment: normalized });
  } catch (e) {
    console.error("[resume/parse] error:", e);
    return NextResponse.json(
      { error: "Could not extract structured employment data. Please add manually." },
      { status: 500 }
    );
  }
}
