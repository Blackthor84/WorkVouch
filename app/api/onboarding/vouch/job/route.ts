/**
 * POST /api/onboarding/vouch/job
 * Minimal job: company + role only (sensible defaults for dates).
 */

import { NextResponse } from "next/server";
import { admin } from "@/lib/supabase-admin";
import { getUser } from "@/lib/auth/getUser";
import { rejectWriteIfImpersonating } from "@/lib/server/rejectWriteIfImpersonating";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const reject = await rejectWriteIfImpersonating();
    if (reject) return reject;

    const user = await getUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: roleRow } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (String((roleRow as { role?: string } | null)?.role ?? "").toLowerCase() === "employer") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const company = typeof body.company_name === "string" ? body.company_name.trim() : "";
    const role = typeof body.role === "string" ? body.role.trim() : "";
    if (company.length < 1 || role.length < 1) {
      return NextResponse.json({ error: "Company and role are required" }, { status: 400 });
    }

    const startIso = new Date().toISOString().slice(0, 10);

    const { data: existing } = await admin
      .from("jobs")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const existingId = (existing as { id?: string } | null)?.id;

    let job: { id: string; company_name: string; job_title: string | null; title: string | null } | null = null;
    let error: { message: string } | null = null;

    if (existingId) {
      const up = await admin
        .from("jobs")
        .update({
          company_name: company,
          job_title: role,
          title: role,
        })
        .eq("id", existingId)
        .eq("user_id", user.id)
        .select("id, company_name, job_title, title")
        .single();
      job = up.data as typeof job;
      error = up.error;
    } else {
      const ins = await admin
        .from("jobs")
        .insert({
          user_id: user.id,
          company_name: company,
          job_title: role,
          title: role,
          start_date: startIso,
          end_date: null,
          is_current: true,
          employment_type: "full_time",
          is_visible_to_employer: false,
          verification_status: "unverified",
        })
        .select("id, company_name, job_title, title")
        .single();
      job = ins.data as typeof job;
      error = ins.error;
    }

    if (error) {
      console.error("[onboarding/vouch/job]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const j = job as { id: string; company_name: string; job_title: string | null; title: string | null };
    return NextResponse.json({
      ok: true,
      job: {
        id: j.id,
        company_name: j.company_name,
        job_title: j.job_title ?? j.title,
      },
    });
  } catch (e) {
    console.error("[onboarding/vouch/job]", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
