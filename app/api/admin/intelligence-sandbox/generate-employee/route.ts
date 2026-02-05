/**
 * POST /api/admin/intelligence-sandbox/generate-employee
 * Creates a sandbox employee: profile, employment record, runs real intelligence pipeline.
 * Requires sandbox_id. Tags every row with sandbox_id. No mock scoring.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSandboxAdmin, validateSandboxForWrite } from "@/lib/sandbox";
import { calculateUserIntelligence } from "@/lib/intelligence/calculateUserIntelligence";
import { runCandidateIntelligence } from "@/lib/intelligence/runIntelligencePipeline";
import { persistUnifiedIntelligence } from "@/lib/intelligence/unified-intelligence";
import type { SimulationContext } from "@/lib/simulation/types";

export const dynamic = "force-dynamic";

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(req: NextRequest) {
  try {
    const { id: adminId } = await requireSandboxAdmin();
    const body = await req.json().catch(() => ({}));
    const sandboxId = body.sandbox_id as string | undefined;
    const fullName = (body.fullName as string) || "Sandbox Employee";
    const jobTitle = (body.jobTitle as string) || "Associate";
    const companyName = (body.companyName as string) || "Sandbox Corp";
    const startDate = (body.startDate as string) || new Date().toISOString().slice(0, 10);
    const endDate = (body.endDate as string) || null;
    const verificationStatus = (body.verificationStatus as string) || "verified";

    if (!sandboxId) {
      return NextResponse.json({ error: "sandbox_id required" }, { status: 400 });
    }

    const sandbox = await validateSandboxForWrite(sandboxId, adminId);
    const context: SimulationContext = { expiresAt: sandbox.ends_at, sandboxId };

    const supabase = getSupabaseServer();
    const suffix = randomSuffix();
    const email = `sandbox-${sandboxId.slice(0, 8)}-${suffix}@sandbox.local`;

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: `Sand${suffix}!Sec`,
      email_confirm: true,
    });
    if (authError || !authUser?.user?.id) {
      return NextResponse.json({ error: authError?.message ?? "Failed to create auth user" }, { status: 400 });
    }
    const userId = authUser.user.id;

    const companyNormalized = companyName.toLowerCase().trim();
    await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        email,
        sandbox_id: sandboxId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    await supabase.from("user_roles").upsert(
      { user_id: userId, role: "user" },
      { onConflict: "user_id,role" }
    );

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
        verification_status: verificationStatus,
        sandbox_id: sandboxId,
      })
      .select("id")
      .single();

    if (erErr) {
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: erErr.message }, { status: 400 });
    }

    await calculateUserIntelligence(userId, context);
    await runCandidateIntelligence(userId, context ?? undefined);
    await persistUnifiedIntelligence(userId, context ?? undefined);

    return NextResponse.json({
      ok: true,
      user_id: userId,
      profile_id: userId,
      employment_record_id: erRow?.id,
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
