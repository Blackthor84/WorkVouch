/**
 * Simulation Lab: create simulated employee persona.
 * Creates auth user (no email send), profile, employment record, runs intelligence pipeline.
 * Never affects production; never triggers Stripe/emails/webhooks.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
import { getSupabaseServer } from "@/lib/supabase/admin";
import { requireSimulationLabAdmin, validateSessionForWrite } from "@/lib/simulation-lab";
import { calculateUserIntelligence } from "@/lib/intelligence/calculateUserIntelligence";
import { runCandidateIntelligence } from "@/lib/intelligence/runIntelligencePipeline";
import { persistUnifiedIntelligence } from "@/lib/intelligence/unified-intelligence";

export const dynamic = "force-dynamic";

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(req: NextRequest) {
  try {
    const { id: adminId } = await requireSimulationLabAdmin();
    const body = await req.json().catch(() => ({}));
    const sessionId = body.sessionId as string;
    const fullName = (body.fullName as string) || "Simulated Employee";
    const jobTitle = (body.jobTitle as string) || "Associate";
    const companyName = (body.companyName as string) || "Sim Corp";
    const startDate = (body.startDate as string) || new Date().toISOString().slice(0, 10);
    const endDate = (body.endDate as string) || null;
    const verificationStatus = (body.verificationStatus as string) || "verified";

    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const session = await validateSessionForWrite(sessionId, adminId);
    const expiresAt = session.expires_at;
    const simulationContext = { simulationSessionId: sessionId, expiresAt };

    const supabase = getSupabaseServer();

    const suffix = randomSuffix();
    const email = `sim-${sessionId.slice(0, 8)}-${suffix}@simulation.local`;

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: `Sim${suffix}!Sec`,
      email_confirm: true,
    });
    if (authError || !authUser?.user?.id) {
      return NextResponse.json({ error: authError?.message ?? "Failed to create auth user" }, { status: 500 });
    }
    const userId = authUser.user.id;

    const companyNormalized = companyName.toLowerCase().trim();
    await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        email,
        is_simulation: true,
        simulation_session_id: sessionId,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    await supabase.from("profiles").update({ role: "user" }).eq("id", userId);

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
        is_simulation: true,
        simulation_session_id: sessionId,
        expires_at: expiresAt,
      })
      .select("id")
      .single();
    if (erErr) {
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: erErr.message }, { status: 500 });
    }

    await calculateUserIntelligence(userId, simulationContext);
    await runCandidateIntelligence(userId, simulationContext);
    await persistUnifiedIntelligence(userId, simulationContext);

    return NextResponse.json({
      ok: true,
      userId,
      profileId: userId,
      employmentRecordId: erRow?.id,
      email,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg === "Unauthorized" || msg.startsWith("Forbidden"))
      return NextResponse.json({ error: msg }, { status: msg === "Unauthorized" ? 401 : 403 });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
