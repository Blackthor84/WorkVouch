/**
 * POST /api/admin/intelligence-sandbox/link-employment
 * Links an employee (profile/user) to an employer by inserting an employment_records row.
 * Requires sandbox_id. All rows tagged with sandbox_id.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxAdmin, validateSandboxForWrite } from "@/lib/sandbox";
import type { Database } from "@/types/database";

type EmployerAccountRow = Database["public"]["Tables"]["employer_accounts"]["Row"];

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id: adminId } = await requireSandboxAdmin();
    const body = await req.json().catch(() => ({}));
    const sandboxId = body.sandbox_id as string | undefined;
    const userId = (body.employee_id as string) || (body.user_id as string) || (body.profile_id as string);
    const employerId = body.employer_id as string;
    const jobTitle = (body.job_title as string) || "Associate";
    const startDate = (body.start_date as string) || new Date().toISOString().slice(0, 10);
    const endDate = (body.end_date as string) || null;

    if (!sandboxId || !userId || !employerId) {
      return NextResponse.json(
        { error: "sandbox_id, employee_id (user_id), and employer_id required" },
        { status: 400 }
      );
    }

    await validateSandboxForWrite(sandboxId, adminId);

    const supabase = getSupabaseServer();

    const { data: employer, error: empErr } = await supabase
      .from("employer_accounts")
      .select("id, company_name")
      .eq("id", employerId)
      .eq("sandbox_id", sandboxId)
      .maybeSingle();

    if (empErr || !employer) {
      return NextResponse.json({ error: "Employer not found or not in sandbox" }, { status: 400 });
    }

    const row = employer as Pick<EmployerAccountRow, "id" | "company_name">;
    const companyName = row.company_name || "Sandbox Corp";
    const companyNormalized = companyName.toLowerCase().trim();

    const { data: erRow, error: erErr } = await supabase
      .from("employment_records")
      .insert({
        user_id: userId,
        company_name: companyName,
        company_normalized: companyNormalized,
        job_title: jobTitle,
        start_date: startDate,
        end_date: endDate || null,
        is_current: !endDate,
        verification_status: "verified",
        employer_id: employerId,
        sandbox_id: sandboxId,
      })
      .select("id")
      .single();

    if (erErr) {
      return NextResponse.json({ error: erErr.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      employment_record_id: (erRow as { id: string })?.id,
      user_id: userId,
      employer_id: employerId,
      company_name: companyName,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden")) {
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
