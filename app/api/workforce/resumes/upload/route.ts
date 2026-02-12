/**
 * POST /api/workforce/resumes/upload
 * Upload resume (PDF/DOCX), extract text, AI parse, store parsed_json, run overlap detection.
 * Enterprise owner or location admin. Environment required. No mock fallback.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireLocationAccess } from "@/lib/enterprise/requireEnterprise";
import { getEnvironmentForServer } from "@/lib/app-mode";
import { extractTextFromBuffer } from "@/lib/workforce/resume-extract";
import { parseResumeWithAI } from "@/lib/workforce/resume-parse-ai";
import { computePeerSuggestions } from "@/lib/workforce/overlap-detection";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const BUCKET = "resumes";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const employeeId = formData.get("employee_id");
    const locationId = formData.get("location_id");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }
    if (!employeeId || typeof employeeId !== "string") {
      return NextResponse.json({ success: false, error: "employee_id required" }, { status: 400 });
    }
    if (!locationId || typeof locationId !== "string") {
      return NextResponse.json({ success: false, error: "location_id required" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Only PDF and DOCX allowed" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, error: "File exceeds 5MB" }, { status: 400 });
    }

    await requireLocationAccess(locationId);
    const env = getEnvironmentForServer(req.headers, undefined, req.url);
    const supabase = getSupabaseServer();

    const { data: employee } = await supabase
      .from("workforce_employees")
      .select("id, organization_id, location_id")
      .eq("id", employeeId)
      .eq("environment", env)
      .single();
    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }
    if (employee.location_id !== locationId) {
      return NextResponse.json({ success: false, error: "Employee not in this location" }, { status: 403 });
    }

    const ext = file.type === "application/pdf" ? "pdf" : "docx";
    const storagePath = `workforce/${employee.organization_id}/${employeeId}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const rawFileUrl = urlData?.publicUrl ?? "";

    const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadErr) {
      console.error("[workforce/resumes/upload] storage:", uploadErr);
      return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
    }

    const { data: resumeRow, error: insertErr } = await supabase
      .from("workforce_resumes")
      .insert({
        employee_id: employeeId,
        raw_file_url: rawFileUrl,
        parsing_status: "extracting",
        environment: env,
      })
      .select("id")
      .single();
    if (insertErr || !resumeRow) {
      console.error("[workforce/resumes/upload] insert:", insertErr);
      return NextResponse.json({ success: false, error: "Failed to create resume record" }, { status: 500 });
    }

    let extractedText: string;
    try {
      const out = await extractTextFromBuffer(buffer, file.type);
      extractedText = out.text;
    } catch (e) {
      console.error("[workforce/resumes/upload] extract:", e);
      await supabase
        .from("workforce_resumes")
        .update({ parsing_status: "failed", parsing_error: e instanceof Error ? e.message : "Extraction failed" })
        .eq("id", resumeRow.id);
      return NextResponse.json({ success: false, error: "Text extraction failed" }, { status: 400 });
    }

    let parsedJson: { full_name?: string; email?: string; phone?: string; work_history?: { company: string; start_date: string; end_date: string | null }[]; skills?: string[]; certifications?: string[] };
    try {
      parsedJson = await parseResumeWithAI(extractedText);
    } catch (e) {
      console.error("[workforce/resumes/upload] parse:", e);
      await supabase
        .from("workforce_resumes")
        .update({ parsing_status: "failed", parsing_error: e instanceof Error ? e.message : "Parsing failed" })
        .eq("id", resumeRow.id);
      return NextResponse.json({ success: false, error: "AI parsing failed" }, { status: 400 });
    }

    await supabase
      .from("workforce_resumes")
      .update({ parsed_json: parsedJson, parsing_status: "completed", parsing_error: null })
      .eq("id", resumeRow.id);

    const { data: otherEmployees } = await supabase
      .from("workforce_employees")
      .select("id")
      .eq("organization_id", employee.organization_id)
      .eq("environment", env)
      .neq("id", employeeId);
    const otherIds = (otherEmployees ?? []).map((r) => r.id);
    const otherResumes: { id: string; parsedWorkHistory: { company: string; start_date: string; end_date: string | null }[] }[] = [];
    for (const id of otherIds) {
      const { data: res } = await supabase
        .from("workforce_resumes")
        .select("id, parsed_json")
        .eq("employee_id", id)
        .eq("environment", env)
        .eq("parsing_status", "completed")
        .not("parsed_json", "is", null)
        .limit(1)
        .single();
      if (res?.parsed_json && typeof res.parsed_json === "object" && Array.isArray((res.parsed_json as { work_history?: unknown }).work_history)) {
        const wh = (res.parsed_json as { work_history: { company?: string; start_date?: string; end_date?: string | null }[] }).work_history;
        otherResumes.push({
          id,
          parsedWorkHistory: wh.map((e) => ({
            company: String(e.company ?? ""),
            start_date: String(e.start_date ?? ""),
            end_date: e.end_date == null ? null : String(e.end_date),
          })),
        });
      }
    }

    const suggestions = computePeerSuggestions(
      employeeId,
      parsedJson as { full_name: string; email: string; work_history: { company: string; start_date: string; end_date: string | null }[]; skills: string[]; certifications: string[] },
      otherResumes
    );
    for (const s of suggestions) {
      await supabase.from("peer_match_suggestions").insert({
        organization_id: employee.organization_id,
        employee_id: employeeId,
        suggested_employee_id: s.suggested_employee_id,
        company_normalized: s.company_normalized,
        overlap_start: s.overlap_start,
        overlap_end: s.overlap_end,
        source_resume_id: resumeRow.id,
        environment: env,
      });
    }

    return NextResponse.json({
      success: true,
      resume_id: resumeRow.id,
      parsed: parsedJson,
      suggestions_count: suggestions.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unauthorized";
    if (msg === "Unauthorized") return NextResponse.json({ success: false, error: msg }, { status: 401 });
    if (msg.startsWith("Forbidden")) return NextResponse.json({ success: false, error: msg }, { status: 403 });
    console.error("[workforce/resumes/upload]", e);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
