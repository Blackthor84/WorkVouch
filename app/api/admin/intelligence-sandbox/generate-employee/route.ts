/**
 * POST /api/admin/intelligence-sandbox/generate-employee
 * Creates a sandbox employee: profile + employment record. Requires sandbox_id. Uses service role; tags rows with sandbox_id.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sandboxId = (body.sandboxId ?? body.sandbox_id) as string | undefined;
    const fullName =
      (body.fullName as string) ?? (body.full_name as string) ?? "Sandbox Employee";
    const companyName =
      (body.companyName as string) ?? (body.company_name as string) ?? "Sandbox Corp";
    const jobTitle =
      (body.jobTitle as string) ?? (body.job_title as string) ?? "Associate";
    const startDate =
      (body.startDate as string) ?? (body.start_date as string) ?? new Date().toISOString().slice(0, 10);
    const endDate = (body.endDate as string) ?? (body.end_date as string) ?? null;
    const verificationStatus =
      (body.verificationStatus as string) ?? (body.verification_status as string) ?? "verified";
    const rehireEligible =
      typeof body.rehire_eligible === "boolean"
        ? body.rehire_eligible
        : body.rehire_eligible === "true" || body.rehire_eligible === true;

    if (!sandboxId) {
      return NextResponse.json(
        { success: false, message: "Missing sandboxId" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const fakeUserId = crypto.randomUUID();
    const email = `sandbox-employee-${Date.now()}@test.com`;
    const companyNormalized = companyName.toLowerCase().trim();

    const { error: profileError } = await supabase.from("profiles").insert({
      id: fakeUserId,
      full_name: fullName,
      email,
      role: "user",
      visibility: "private",
      sandbox_id: sandboxId,
    });

    if (profileError) {
      return NextResponse.json(
        { success: false, message: profileError.message },
        { status: 400 }
      );
    }

    const { error: employmentError } = await supabase.from("employment_records").insert({
      user_id: fakeUserId,
      company_name: companyName,
      company_normalized: companyNormalized,
      job_title: jobTitle,
      start_date: startDate,
      end_date: endDate,
      is_current: !endDate,
      verification_status: verificationStatus,
      rehire_eligible: rehireEligible,
      sandbox_id: sandboxId,
    });

    if (employmentError) {
      return NextResponse.json(
        { success: false, message: employmentError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: fakeUserId,
      profileId: fakeUserId,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}
