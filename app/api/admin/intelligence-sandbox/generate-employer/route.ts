/**
 * POST /api/admin/intelligence-sandbox/generate-employer
 * Creates a sandbox employer. Requires sandbox_id. Tags row with sandbox_id.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxAdmin, validateSandboxForWrite } from "@/lib/sandbox";

export const dynamic = "force-dynamic";

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(req: NextRequest) {
  try {
    const { id: adminId } = await requireSandboxAdmin();
    const body = await req.json().catch(() => ({}));
    const sandboxId = body.sandbox_id as string | undefined;
    const companyName = (body.companyName as string) || "Sandbox Employer Corp";
    const planTier = (body.planTier as string) || "pro";

    if (!sandboxId) {
      return NextResponse.json({ error: "sandbox_id required" }, { status: 400 });
    }

    await validateSandboxForWrite(sandboxId, adminId);

    const supabase = getSupabaseServer();
    const suffix = randomSuffix();
    const email = `sandbox-employer-${sandboxId.slice(0, 8)}-${suffix}@sandbox.local`;

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: `SandEmp${suffix}!Sec`,
      email_confirm: true,
    });
    if (authError || !authUser?.user?.id) {
      return NextResponse.json({ error: authError?.message ?? "Failed to create auth user" }, { status: 400 });
    }
    const userId = authUser.user.id;

    await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: companyName,
        email,
        sandbox_id: sandboxId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    await supabase.from("user_roles").upsert(
      { user_id: userId, role: "employer" },
      { onConflict: "user_id,role" }
    );

    const { data: eaRow, error: eaErr } = await supabase
      .from("employer_accounts")
      .insert({
        user_id: userId,
        company_name: companyName,
        plan_tier: planTier,
        sandbox_id: sandboxId,
        reports_used: 0,
        searches_used: 0,
      })
      .select("id")
      .single();

    if (eaErr) {
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: eaErr.message }, { status: 400 });
    }

    const employerAccountId = (eaRow as Pick<EmployerAccountRow, "id"> | null)?.id ?? userId;
    return NextResponse.json({
      ok: true,
      employer_id: employerAccountId,
      company_name: companyName,
      plan_tier: planTier,
      email,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden")) {
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
