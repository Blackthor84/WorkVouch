/**
 * POST /api/admin/intelligence-sandbox/generate-employer
 * Creates a sandbox employer. Requires sandboxId. Uses service role; inserts profiles + employer_accounts with sandbox_id.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sandboxId = (body.sandboxId ?? body.sandbox_id) as string | undefined;
    const companyName =
      (body.companyName as string) ?? (body.company_name as string) ?? "Sandbox Company";

    if (!sandboxId) {
      return NextResponse.json(
        { success: false, message: "Missing sandboxId" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const fakeUserId = crypto.randomUUID();
    const email = `sandbox-employer-${Date.now()}@test.com`;

    const { error: profileError } = await supabase.from("profiles").insert({
      id: fakeUserId,
      full_name: companyName,
      email,
      role: "employer",
      visibility: "private",
      sandbox_id: sandboxId,
    });

    if (profileError) {
      console.error("Employer insert failed (profile):", profileError);
      return NextResponse.json(
        { success: false, message: profileError.message },
        { status: 400 }
      );
    }

    const { error: employerError } = await supabase.from("employer_accounts").insert({
      user_id: fakeUserId,
      company_name: companyName,
      plan_tier: "pro",
      sandbox_id: sandboxId,
    });

    if (employerError) {
      console.error("Employer insert failed (employer_accounts):", employerError);
      return NextResponse.json(
        { success: false, message: employerError.message },
        { status: 400 }
      );
    }

    console.log("Employer inserted:", fakeUserId);
    return NextResponse.json({
      success: true,
      employerId: fakeUserId,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ success: false, message: msg }, { status: 400 });
  }
}
